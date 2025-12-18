import React from 'react';

const ControlBar = ({ 
    onStart, onStop, onReset, isRecording,
    onSendConv, onSendHelper, onSendCombined,
    isResetDisabled
}) => {
    return (
        <div className="control-bar">
            {!isRecording ? (
                <button className="btn-primary" onClick={onStart}>Start Conversation</button>
            ) : (
                <button className="btn-danger" onClick={onStop}>Stop Conversation</button>
            )}
            
            <div className="divider-vertical"></div>
            
            <button className="btn-secondary" onClick={() => {}}>Start Helper</button>
            <button className="btn-secondary" onClick={() => {}}>Stop Helper</button>
            
            <div className="divider-vertical"></div>

            <button className="btn-action" onClick={onSendConv}>Send Conversation</button>
            <button className="btn-action" onClick={onSendHelper}>Send Helper</button>
            <button className="btn-action" onClick={onSendCombined}>Send Combined</button>
            
            <div className="divider-vertical"></div>

            <button className="btn-text" onClick={onReset} disabled={isResetDisabled}>Reset Anchor</button>
        </div>
    );
};

export default ControlBar;
