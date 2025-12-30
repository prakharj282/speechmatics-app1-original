import React, { useState, useEffect, useRef } from 'react';
import { SpeechmaticsClient } from './utils/speechmatics';
import { AudioProcessor } from './utils/audioProcessor';
// Components
import TopBar from './components/TopBar';
import ConversationTranscript from './components/ConversationTranscript';
import HelperTranscript from './components/HelperTranscript';
import ControlBar from './components/ControlBar';
import SettingsModal from './components/SettingsModal';

const STORAGE_KEY_API_KEY = 'sm_api_key';

function App() {
    // --- State ---
    const [apiKey, setApiKey] = useState(localStorage.getItem(STORAGE_KEY_API_KEY) || '');
    const [language, setLanguage] = useState('en');
    const [devices, setDevices] = useState([]);
    const [device1, setDevice1] = useState('');
    const [device2, setDevice2] = useState('');
    
    // Status
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('Stopped'); 

    // Data - The Core Model
    const [blocks, setBlocks] = useState([]); // { id, speaker: 'INTERVIEWER'|'CANDIDATE', text }
    const [helperText, setHelperText] = useState('');
    const [sentBlockCount, setSentBlockCount] = useState(0);
    const [lastSentParams, setLastSentParams] = useState(null); 

    // Refs for functional state access (Stale closure fix)
    const sentBlockCountRef = useRef(0);
    const clientRef = useRef(null);
    const processorRef = useRef(null);

    // UI
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [toastMsg, setToastMsg] = useState(null); // Toast State

    // Toast Timer
    useEffect(() => {
        if (toastMsg) {
            const timer = setTimeout(() => setToastMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMsg]);

    const showToast = (msg) => {
        setToastMsg(msg);
    };

    // --- Target Selection State ---
    const [availableTabs, setAvailableTabs] = useState([]);
    const [selectedTabId, setSelectedTabId] = useState('');

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
    }, [apiKey]);

    // Keep ref in sync
    useEffect(() => {
        sentBlockCountRef.current = sentBlockCount;
    }, [sentBlockCount]);

    useEffect(() => {
        async function getDevices() {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const dev = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = dev.filter(d => d.kind === 'audioinput');
                setDevices(audioInputs);
                if (audioInputs.length > 0) {
                    setDevice1(audioInputs[0].deviceId);
                    if (audioInputs.length > 1) setDevice2(audioInputs[1].deviceId);
                    else setDevice2(audioInputs[0].deviceId);
                }
            } catch (e) {
                console.error("Device Enum Error", e);
                setError("Microphone permission denied.");
            }
        }
        getDevices();
    }, []);


    // --- External Command Listener ---
    useEffect(() => {
        const handleMessage = (event) => {
             if (!event.data) return;
             
             // 1. Commands
             if (event.data.type === 'TRIGGER_COMMAND') {
                 console.log('App received command:', event.data.command);
                 if (event.data.command === 'send-conversation') handleSendConversation();
                 if (event.data.command === 'send-helper') handleSendHelper();
                 if (event.data.command === 'send-combined') handleSendCombined();
             }

             // 2. Tab List
             if (event.data.type === 'COPILOT_TABS_LIST') {
                const tabs = event.data.tabs || [];
                setAvailableTabs(tabs);
                if (tabs.length > 0) {
                    // Fix: Ensure strict type matching (IDs are numbers)
                    const currentId = Number(selectedTabId);
                    if (!selectedTabId || !tabs.find(t => t.id === currentId)) {
                        setSelectedTabId(tabs[0].id);
                    }
                } else {
                    setSelectedTabId('');
                }
             }
        };
        window.addEventListener('message', handleMessage);
        
        // Initial fetch
        setTimeout(() => {
            window.postMessage({ type: 'COPILOT_GET_TABS' }, '*');
        }, 1000);

        return () => window.removeEventListener('message', handleMessage);
    }, [blocks, sentBlockCount, helperText, selectedTabId]); 

    // --- Tab Management ---
    const fetchAvailableTabs = () => {
        window.postMessage({ type: 'COPILOT_GET_TABS' }, '*');
    };

    // --- Logic ---
    const addTranscriptChunk = (speaker, text) => {
        setBlocks(prev => {
            const lastBlock = prev.length > 0 ? prev[prev.length - 1] : null;
            const lastBlockIndex = prev.length - 1;
            
            // "Hard Split" Logic
            const isLastBlockSent = lastBlockIndex < sentBlockCountRef.current;

            // Case 1: Stitch Back
            if (lastBlock && lastBlock.speaker === speaker && !isLastBlockSent) {
                const updatedBlock = {
                    ...lastBlock,
                    text: (lastBlock.text + ' ' + text).trim()
                };
                return [...prev.slice(0, -1), updatedBlock];
            }
            
            // Case 2: New Block
            const newBlock = {
                id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                speaker: speaker,
                text: text.trim()
            };
            return [...prev, newBlock];
        });
    };

    // --- Send Logic ---
    const sendChunkToTarget = (text) => {
        console.log("SENDING CHUNK:", text, "TO TAB:", selectedTabId);
        
        // 1. Copy to Clipboard (Backup)
        navigator.clipboard.writeText(text).catch(err => console.error("Clipboard failed", err));

        // 2. Send to Extension
        if (selectedTabId) {
             window.postMessage({
                type: 'COPILOT_SEND_CHUNK',
                text: text,
                tabId: selectedTabId
            }, '*');
        } else {
            console.warn("No target tab selected");
        }
        
        setLastSentParams({ text, time: new Date().toLocaleTimeString() });
    };

    const formatBlock = (block) => {
        const speakerName = block.speaker === 'INTERVIEWER' ? 'Interviewer' : 'Candidate';
        return `${speakerName}\n{\n  ${block.text}\n}`;
    };

    const formatHelper = (text) => {
        return `Helper\n{\n  ${text}\n}`;
    };

    const handleSendConversation = () => {
        const unsentBlocks = blocks.slice(sentBlockCount);
        if (unsentBlocks.length === 0) {
            console.log("No new conversation to send");
            return;
        }

        const chunkText = unsentBlocks.map(formatBlock).join('\n\n');
        sendChunkToTarget(chunkText);
        setSentBlockCount(blocks.length);
        showToast("Conversation Sent!");
    };

    const handleSendHelper = () => {
        if (!helperText.trim()) {
            console.log("No helper text");
            return;
        }

        const chunkText = formatHelper(helperText);
        sendChunkToTarget(chunkText);
        setHelperText('');
        showToast("Helper Sent!");
    };

    const handleSendCombined = () => {
        const unsentBlocks = blocks.slice(sentBlockCount);
        const hasConv = unsentBlocks.length > 0;
        const hasHelper = !!helperText.trim();

        if (!hasConv && !hasHelper) return;

        let parts = [];
        if (hasConv) {
            parts.push(unsentBlocks.map(formatBlock).join('\n\n'));
        }
        if (hasHelper) {
            parts.push(formatHelper(helperText));
        }

        const combinedText = parts.join('\n\n');
        sendChunkToTarget(combinedText);

        if (hasConv) setSentBlockCount(blocks.length);
        if (hasHelper) setHelperText('');
        showToast("Combined Text Sent!");
    };

    const handleResetAnchor = () => {
        setSentBlockCount(blocks.length);
        showToast("Anchor Reset!");
    };

    // --- Handlers ---
    const handleStart = async () => {
        setError(null);
        setBlocks([]);
        setSentBlockCount(0);
        
        if (!apiKey) {
            setError("Please enter an API Key.");
            setStatus('Error');
            return;
        }

        try {
            setIsConnecting(true);
            setStatus('Connecting...');

            // Token gen
            let token = apiKey;
            try {
                const resp = await fetch('/api/sm/v1/api_keys?type=rt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ ttl: 3600 })
                });

                if (!resp.ok) {
                    const errText = await resp.text();
                    console.warn("Token Generation Failed (falling back to raw key):", resp.status, errText);
                } else {
                    const data = await resp.json();
                    if (data.key_value) token = data.key_value;
                }
            } catch (e) { 
                console.warn("Token gen network error (falling back to raw key)", e);
            }

            clientRef.current = new SpeechmaticsClient();
            processorRef.current = new AudioProcessor();

            // Use 'Speaker 1' / 'Speaker 2' to match AudioProcessor
            await clientRef.current.connect(token, {
                channelLabels: ['Speaker 1', 'Speaker 2'],
                language: language
            });

            clientRef.current.onTranscript = (data) => {
                const isPartial = data.message === 'AddPartialTranscript';
                if (isPartial) return; 
                
                const results = data.results;
                if (!results || results.length === 0) return;
                
                // Map 'Speaker 1' -> 'INTERVIEWER', 'Speaker 2' -> 'CANDIDATE'
                let speaker = data.channel; 
                if (speaker === 'Speaker 1') speaker = 'INTERVIEWER';
                if (speaker === 'Speaker 2') speaker = 'CANDIDATE';
                
                const content = results.map(r => r.alternatives[0].content).join(' ');
                if (!content.trim()) return;

                addTranscriptChunk(speaker, content);
            };

            clientRef.current.onError = (err) => {
                setError(`Error: ${JSON.stringify(err)}`);
                setStatus('Error');
                stopAll();
            };

            await processorRef.current.start(device1, device2, (ch, d) => {
                clientRef.current.sendAudio(ch, d);
            });

            setIsRecording(true);
            setStatus('Live');

        } catch (e) {
            console.error("Connection failed", e);
            setError(e.message);
            setStatus('Error');
            stopAll();
        } finally {
            setIsConnecting(false);
        }
    };

    const stopAll = () => {
        if (processorRef.current) processorRef.current.stop();
        if (clientRef.current) clientRef.current.disconnect();
        setIsRecording(false);
        setStatus(current => current === 'Error' ? 'Error' : 'Stopped');
    };

    return (
        <div className="app-container">
            <TopBar 
                status={status} 
                onOpenSettings={() => setIsSettingsOpen(true)}
                availableTabs={availableTabs}
                selectedTabId={selectedTabId}
                onSelectTab={(val) => setSelectedTabId(Number(val))}
                onRefreshTabs={fetchAvailableTabs}
            />
            
            <ConversationTranscript 
                blocks={blocks} 
                sentBlockCount={sentBlockCount} 
            />
            
            <HelperTranscript 
                helperText={helperText} 
                onChange={setHelperText} 
            />
            
            <ControlBar 
                isRecording={isRecording}
                onStart={handleStart} 
                onStop={stopAll} 
                onReset={handleResetAnchor}
                onSendConv={handleSendConversation}
                onSendHelper={handleSendHelper}
                onSendCombined={handleSendCombined}
                isResetDisabled={blocks.length === 0 || sentBlockCount === blocks.length}
            />

            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                apiKey={apiKey} setApiKey={setApiKey}
                language={language} setLanguage={setLanguage}
                devices={devices}
                device1={device1} setDevice1={setDevice1}
                device2={device2} setDevice2={setDevice2}
            />
            
            {lastSentParams && (
                <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#666', borderTop: '1px solid #333' }}>
                    Last sent ({lastSentParams.time}): {lastSentParams.text.substring(0, 50)}...
                </div>
            )}

            {/* TOAST UI */}
            {toastMsg && (
                <div className="toast-notification">
                    {toastMsg}
                </div>
            )}
        </div>
    );
}

export default App;
