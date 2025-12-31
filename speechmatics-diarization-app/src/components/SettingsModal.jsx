import React from 'react';

const SettingsModal = ({
    isOpen, onClose,
    apiKey, setApiKey,
    helperApiKey, setHelperApiKey,
    language, setLanguage,
    devices,
    device1, setDevice1,
    device2, setDevice2,
    helperDevice, setHelperDevice
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <h2>Settings</h2>

                <div className="settings-section">
                    <h3>Conversation Section</h3>
                    <div className="form-group">
                        <label>Conversation API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter Speechmatics API Key for Conversation"
                            className="input-field"
                        />
                    </div>

                    <div className="form-group">
                        <label>Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="select-field"
                        >
                            <option value="en">English</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="es">Spanish</option>
                            <option value="it">Italian</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Interviewer Mic</label>
                        <select value={device1} onChange={(e) => setDevice1(e.target.value)} className="select-field">
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Device ${d.deviceId}`}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Candidate Mic</label>
                        <select value={device2} onChange={(e) => setDevice2(e.target.value)} className="select-field">
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Device ${d.deviceId}`}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #444' }} />

                <div className="settings-section">
                    <h3>Recommendation Section</h3>
                    <div className="form-group">
                        <label>Recommendation API Key</label>
                        <input
                            type="text"
                            value={helperApiKey}
                            onChange={(e) => setHelperApiKey(e.target.value)}
                            placeholder="Enter Independent API Key for Helper"
                            className="input-field"
                        />
                    </div>

                    <div className="form-group">
                        <label>Recommend Interview Mic</label>
                        <select value={helperDevice} onChange={(e) => setHelperDevice(e.target.value)} className="select-field">
                            <option value="">Select Helper Mic...</option>
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Device ${d.deviceId}`}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button className="btn-primary" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
