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
const STORAGE_KEY_HELPER_API_KEY = 'sm_helper_api_key'; // New Key

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

                    // Simple default logic, user can change in settings
                    if (audioInputs.length > 1) {
                        setDevice2(audioInputs[1].deviceId);
                        setHelperDevice(audioInputs[1].deviceId); // Default helper to 2nd mic initially
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

    // --- Logic ---
    const addTranscriptChunk = (speaker, text) => {
        setBlocks(prev => {
            const lastBlock = prev.length > 0 ? prev[prev.length - 1] : null;
            if (lastBlock && lastBlock.speaker === speaker) {
                const updatedBlock = { ...lastBlock, text: (lastBlock.text + ' ' + text).trim() };
                return [...prev.slice(0, -1), updatedBlock];
            }
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
        console.log("SENDING CHUNK:", text);
        navigator.clipboard.writeText(text).then(() => {
            setLastSentParams({ text, time: new Date().toLocaleTimeString() });
        }).catch(err => {
            console.error("Clipboard failed", err);
            setError("Clipboard copy failed");
        });
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
        if (unsentBlocks.length === 0) return;
        const chunkText = unsentBlocks.map(formatBlock).join('\n\n');
        sendChunkToTarget(chunkText);
        setSentBlockCount(blocks.length);
    };

    const handleSendHelper = () => {
        if (!helperText.trim()) return;
        const chunkText = formatHelper(helperText);
        sendChunkToTarget(chunkText);
        setHelperText('');
    };

    const handleSendCombined = () => {
        const unsentBlocks = blocks.slice(sentBlockCount);
        const hasConv = unsentBlocks.length > 0;
        const hasHelper = !!helperText.trim();

        if (!hasConv && !hasHelper) return;

        let parts = [];
        if (hasConv) parts.push(unsentBlocks.map(formatBlock).join('\n\n'));
        if (hasHelper) parts.push(formatHelper(helperText));

        const combinedText = parts.join('\n\n');
        sendChunkToTarget(combinedText);

        if (hasConv) setSentBlockCount(blocks.length);
        if (hasHelper) setHelperText('');
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
                if (!content.trim()) return;

                addTranscriptChunk(speaker, content);
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

            // Use Helper API Key for independent session
            let token = await generateToken(helperApiKey);

            helperClientRef.current = new SpeechmaticsClient();
            helperProcessorRef.current = new AudioProcessor();

            // FIXED: Use 'channel' diarization with explicit 'Helper' label
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

            // FIXED: Send audio to 'Helper' channel, matching the config
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
                // If it fails (e.g. 401), we might want to throw or just fallback.
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
        </div>
    );
}

export default App;
