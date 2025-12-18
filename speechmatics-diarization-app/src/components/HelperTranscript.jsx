import React from 'react';

const HelperTranscript = ({
    helperText,
    onChange = () => { },
    isRecording = false,
    onStart = () => { },
    onStop = () => { },
    hasApiKey = false,
    hasDevice = false
}) => {

    const isReady = hasApiKey && hasDevice;
    const title = !isReady ? "Configure Key/Mic in Settings" : "Ready to Start";

    return (
        <div className="helper-container">
            <div className="helper-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Helper</span>
                <div className="helper-controls" style={{ display: 'flex', gap: '5px' }}>

                    {!isRecording ? (
                        <button
                            onClick={onStart}
                            disabled={!isReady}
                            title={title}
                            style={{
                                fontSize: '0.8rem',
                                padding: '2px 8px',
                                cursor: !isReady ? 'not-allowed' : 'pointer',
                                backgroundColor: isReady ? '#4CAF50' : '#555',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px'
                            }}
                        >
                            Start
                        </button>
                    ) : (
                        <button
                            onClick={onStop}
                            style={{
                                fontSize: '0.8rem',
                                padding: '2px 8px',
                                cursor: 'pointer',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px'
                            }}
                        >
                            Stop
                        </button>
                    )}
                </div>
            </div>
            <div className="helper-box">
                <div className="helper-label">Helper</div>
                <div className="brace">{'{'}</div>
                <textarea
                    className="helper-input"
                    value={helperText}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="(Type private instruction here...)"
                    spellCheck="false"
                />
                <div className="brace">{'}'}</div>
            </div>
        </div>
    );
};

export default HelperTranscript;
