import React, { useState, useEffect, useRef } from 'react';
import { SpeechmaticsClient } from './utils/speechmatics';
import { AudioProcessor } from './utils/audioProcessor';
import { buildConversationChunk, buildHelperChunk, buildCombinedChunk } from './utils/chunking';

// Components
import TopBar from './components/TopBar';
import ConversationTranscript from './components/ConversationTranscript';
import HelperTranscript from './components/HelperTranscript';
import ControlBar from './components/ControlBar';
import SettingsModal from './components/SettingsModal';

const STORAGE_KEY_API_KEY = 'sm_api_key';
const STORAGE_KEY_HELPER_API_KEY = 'sm_helper_api_key';

// Tune this value for cross-talk sensitivity
const MERGE_WINDOW_SECONDS = 2.5;

function App() {
    // --- State ---
    const [apiKey, setApiKey] = useState(localStorage.getItem(STORAGE_KEY_API_KEY) || '');
    const [helperApiKey, setHelperApiKey] = useState(localStorage.getItem(STORAGE_KEY_HELPER_API_KEY) || '');

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
    const [blocks, setBlocks] = useState([]);
    const [sentBlockCount, setSentBlockCount] = useState(0);
    const [lastSentParams, setLastSentParams] = useState(null);

    // Helper State
    const [helperText, setHelperText] = useState('');
    const [helperDevice, setHelperDevice] = useState('');
    const [isHelperRecording, setIsHelperRecording] = useState(false);
    const [helperStatus, setHelperStatus] = useState('Stopped');

    // UI
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // Refs
    const clientRef = useRef(null);
    const processorRef = useRef(null);
    const helperClientRef = useRef(null);
    const helperProcessorRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
    }, [apiKey]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_HELPER_API_KEY, helperApiKey);
    }, [helperApiKey]);

    useEffect(() => {
        async function getDevices() {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const dev = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = dev.filter(d => d.kind === 'audioinput');
                setDevices(audioInputs);
                if (audioInputs.length > 0) {
                    setDevice1(audioInputs[0].deviceId);
                    if (audioInputs.length > 1) {
                        setDevice2(audioInputs[1].deviceId);
                        setHelperDevice(audioInputs[1].deviceId);
                    } else {
                        setDevice2(audioInputs[0].deviceId);
                        setHelperDevice(audioInputs[0].deviceId);
                    }
                }
            } catch (e) {
                console.error("Device Enum Error", e);
                setError("Microphone permission denied.");
            }
        }
        getDevices();
    }, []);

    // --- Hotkey Listener ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Alt+Shift+1 -> Conversation
            if (e.altKey && e.shiftKey && e.key === '1') {
                e.preventDefault();
                handleSendConversation();
            }
            // Alt+Shift+2 -> Helper
            if (e.altKey && e.shiftKey && e.key === '2') {
                e.preventDefault();
                handleSendHelper();
            }
            // Alt+Shift+3 -> Combined
            if (e.altKey && e.shiftKey && e.key === '3') {
                e.preventDefault();
                handleSendCombined();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [blocks, sentBlockCount, helperText]); // Dependencies needed for handlers to see current state

    // --- Logic ---
    const addTranscriptChunk = (speaker, text, endTime) => {
        setBlocks(prev => {
            const lastBlock = prev.length > 0 ? prev[prev.length - 1] : null;

            // 1. Same speaker continuing immediately -> Append
            if (lastBlock && lastBlock.speaker === speaker) {
                const updatedBlock = {
                    ...lastBlock,
                    text: (lastBlock.text + ' ' + text).trim(),
                    endTime: endTime
                };
                return [...prev.slice(0, -1), updatedBlock];
            }

            // 2. Stitching Back Strategy
            // If the speaker matches the *previous* block (before the interruption)
            // AND the gap is small (< MERGE_WINDOW_SECONDS), merge into that previous block.
            if (prev.length >= 2) {
                const previousBlock = prev[prev.length - 2];
                if (previousBlock.speaker === speaker) {
                    const lastEndTime = previousBlock.endTime || 0;
                    if (lastEndTime > 0 && (endTime - lastEndTime) < MERGE_WINDOW_SECONDS) {
                        const updatedPrev = {
                            ...previousBlock,
                            text: (previousBlock.text + ' ' + text).trim(),
                            endTime: endTime
                        };
                        // We update the *previous* block, leaving the interruption (lastBlock) as is.
                        const newBlocks = [...prev];
                        newBlocks[newBlocks.length - 2] = updatedPrev;
                        return newBlocks;
                    }
                }
            }

            // 3. New Speaker / New Block
            const newBlock = {
                id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                speaker: speaker,
                text: text.trim(),
                endTime: endTime
            };
            return [...prev, newBlock];
        });
    };

    // --- Send Logic Refactored ---
    const broadcastChunk = (mode, text) => {
        if (!text) {
            console.log(`No text to send for mode: ${mode}`);
            return false;
        }

        console.log(`BROADCASTING CHUNK (${mode}):`, text);

        // 1. Copy to Clipboard
        navigator.clipboard.writeText(text).then(() => {
            // 2. Post Message for Extension
            window.postMessage({
                type: "COPILOT_SEND_CHUNK",
                mode: mode,
                text: text
            }, "*");

            // 3. UI Feedback
            setLastSentParams({ text, time: new Date().toLocaleTimeString() });
            showToast(`${mode} chunk sent to extension (also in clipboard).`);

        }).catch(err => {
            console.error("Clipboard failed", err);
            setError("Clipboard copy failed");
        });

        return true;
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleSendConversation = () => {
        const chunkText = buildConversationChunk(blocks, sentBlockCount);
        if (broadcastChunk("conversation", chunkText)) {
            setSentBlockCount(blocks.length);
        }
    };

    const handleSendHelper = () => {
        const chunkText = buildHelperChunk(helperText);
        if (broadcastChunk("helper", chunkText)) {
            setHelperText('');
        }
    };

    const handleSendCombined = () => {
        const chunkText = buildCombinedChunk(blocks, sentBlockCount, helperText);
        // Important: check if we have anything. buildCombinedChunk determines this.
        if (broadcastChunk("combined", chunkText)) {
            setSentBlockCount(blocks.length);
            setHelperText('');
        }
    };

    const handleResetAnchor = () => {
        setSentBlockCount(blocks.length);
    };

    // --- Main Connection ---
    const handleStart = async () => {
        setError(null);
        setBlocks([]);
        setSentBlockCount(0);
        if (!apiKey) {
            setError("Please enter Conversation API Key in Settings.");
            setStatus('Error');
            return;
        }
        try {
            setIsConnecting(true);
            setStatus('Connecting...');
            let token = await generateToken(apiKey);
            clientRef.current = new SpeechmaticsClient();
            processorRef.current = new AudioProcessor();
            await clientRef.current.connect(token, {
                channelLabels: ['Speaker 1', 'Speaker 2'],
                language: language
            });
            clientRef.current.onTranscript = (data) => {
                if (data.message === 'AddPartialTranscript') return;
                const results = data.results;
                if (!results || results.length === 0) return;
                let speaker = data.channel;
                if (speaker === 'Speaker 1') speaker = 'INTERVIEWER';
                if (speaker === 'Speaker 2') speaker = 'CANDIDATE';

                const content = results.map(r => r.alternatives[0].content).join(' ');
                // Get end_time from the last result
                const lastResult = results[results.length - 1];
                const endTime = lastResult ? lastResult.end_time : undefined;

                if (!content.trim()) return;
                addTranscriptChunk(speaker, content, endTime);
            };
            clientRef.current.onError = (err) => {
                setError(`Conversation Error: ${JSON.stringify(err)}`);
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

    // --- Helper Connection ---
    const handleStartHelper = async () => {
        if (!helperApiKey) {
            setError("Helper API Key required in Settings.");
            return;
        }
        if (!helperDevice) {
            setError("Select a Helper Mic in Settings.");
            return;
        }
        try {
            setHelperStatus('Connecting...');
            let token = await generateToken(helperApiKey);
            helperClientRef.current = new SpeechmaticsClient();
            helperProcessorRef.current = new AudioProcessor();
            await helperClientRef.current.connect(token, {
                language: language,
                diarization: 'channel',
                channelLabels: ['Helper']
            });
            helperClientRef.current.onTranscript = (data) => {
                if (data.message === 'AddPartialTranscript') return;
                const results = data.results;
                if (!results || results.length === 0) return;
                const content = results.map(r => r.alternatives[0].content).join(' ');
                if (!content.trim()) return;
                setHelperText(prev => (prev + ' ' + content).trim());
            };
            helperClientRef.current.onError = (err) => {
                console.error("Helper Error", err);
                setHelperStatus('Error');
                stopHelper();
            };
            await helperProcessorRef.current.startSingle(helperDevice, 'Helper', (ch, d) => {
                helperClientRef.current.sendAudio('Helper', d);
            });
            setIsHelperRecording(true);
            setHelperStatus('Live');
        } catch (e) {
            console.error("Helper Start Failed", e);
            setError("Helper Start Failed: " + e.message);
            stopHelper();
        }
    };

    const stopHelper = () => {
        if (helperProcessorRef.current) helperProcessorRef.current.stop();
        if (helperClientRef.current) helperClientRef.current.disconnect();
        setIsHelperRecording(false);
        setHelperStatus('Stopped');
    };

    const generateToken = async (key) => {
        try {
            const resp = await fetch('/api/sm/v1/api_keys?type=rt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({ ttl: 3600 })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.key_value) return data.key_value;
            } else {
                console.warn("Token gen failed status", resp.status);
            }
        } catch (e) {
            console.warn("Token gen failed", e);
        }
        return key;
    };

    return (
        <div className="app-container">
            <TopBar
                status={status}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <ConversationTranscript
                blocks={blocks}
                sentBlockCount={sentBlockCount}
            />

            <HelperTranscript
                helperText={helperText}
                onChange={setHelperText}
                isRecording={isHelperRecording}
                onStart={handleStartHelper}
                onStop={stopHelper}
                hasApiKey={!!helperApiKey}
                hasDevice={!!helperDevice}
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
                helperApiKey={helperApiKey} setHelperApiKey={setHelperApiKey}
                language={language} setLanguage={setLanguage}
                devices={devices}
                device1={device1} setDevice1={setDevice1}
                device2={device2} setDevice2={setDevice2}
                helperDevice={helperDevice} setHelperDevice={setHelperDevice}
            />

            {lastSentParams && (
                <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#666', borderTop: '1px solid #333' }}>
                    Last sent ({lastSentParams.time}): {lastSentParams.text.substring(0, 50)}...
                </div>
            )}

            {error && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'red', color: 'white', padding: '10px', borderRadius: '5px', zIndex: 1000, cursor: 'pointer' }} onClick={() => setError(null)}>
                    {error}
                </div>
            )}

            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    top: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#333',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    zIndex: 2000,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
}

export default App;
