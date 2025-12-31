import React from 'react';

const HelperTranscript = ({
    helperText,
    onChange = () => { },
    isRecording = false,
    onStart = () => { },
    onStop = () => { },
    hasApiKey = false,
    hasDevice = false,
    status = 'Stopped',
    error = null
}) => {

    const isReady = hasApiKey && hasDevice;
    const title = !isReady ? "Configure Key/Mic in Settings" : "Ready to Start";

    return (
        <div className="helper-container">
            {/* Error Bar - Overlays or Pushes content down */}
            {error && (
                <div style={{
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid #ef9a9a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="helper-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Helper</span>
                <div className="helper-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                    {/* Status Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            backgroundColor: status === 'Live' ? '#4CAF50' : status === 'Connecting...' ? '#FFC107' : status === 'Error' ? '#F44336' : '#777'
                        }} />
                        <span style={{ color: status === 'Error' ? '#F44336' : '#aaa' }}>
                            {status === 'Error' ? 'Error' : status}
                        </span>
                    </div>

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
