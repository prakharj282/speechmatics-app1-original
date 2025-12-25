import React from 'react';

const TopBar = ({ status, onOpenSettings, availableTabs = [], selectedTabId, onSelectTab, onRefreshTabs }) => {
    let statusColor = '#999';
    if (status === 'Live') statusColor = '#10b981';
    if (status === 'Error') statusColor = '#ef4444';

    return (
        <div className="top-bar">
            {/* Left: Status */}
            <div className="status-indicator">
                <span className="status-dot" style={{ backgroundColor: statusColor }}></span>
                <span className="status-text">{status}</span>
            </div>

            {/* Middle: Target Selector */}
            <div className="target-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>Target:</span>
                <select 
                    value={selectedTabId || ''} 
                    onChange={(e) => onSelectTab(e.target.value)}
                    style={{ 
                        background: '#333', 
                        color: '#eee', 
                        border: '1px solid #444', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        maxWidth: '200px'
                    }}
                >
                    {availableTabs.length === 0 && <option value="">No Active Targets</option>}
                    {availableTabs.map(tab => (
                        <option key={tab.id} value={tab.id}>
                            {tab.title.substring(0, 30)}{tab.title.length > 30 ? '...' : ''}
                        </option>
                    ))}
                </select>
                <button 
                    onClick={onRefreshTabs}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#666', 
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0 4px'
                    }}
                    title="Refresh Targets"
                >
                    ↻
                </button>
            </div>

            {/* Right: Settings */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="settings-btn" onClick={onOpenSettings}>
                    Settings
                </button>
            </div>
        </div>
    );
};

export default TopBar;
