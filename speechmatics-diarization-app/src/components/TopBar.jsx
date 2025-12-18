import React from 'react';

const TopBar = ({ status, onOpenSettings }) => {
    let statusColor = '#999';
    if (status === 'Live') statusColor = '#10b981';
    if (status === 'Error') statusColor = '#ef4444';

    return (
        <div className="top-bar">
            <div className="status-indicator">
                <span className="status-dot" style={{ backgroundColor: statusColor }}></span>
                <span className="status-text">{status}</span>
            </div>
            <button className="settings-btn" onClick={onOpenSettings}>
                Settings
            </button>
        </div>
    );
};

export default TopBar;
