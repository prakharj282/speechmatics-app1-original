import React, { useEffect, useRef } from 'react';

const ConversationTranscript = ({ blocks, sentBlockCount }) => {
    const scrollRef = useRef(null);
    const isAtBottomRef = useRef(true);

    // Split the blocks into two arrays
    const sentBlocks = blocks.slice(0, sentBlockCount);
    const unsentBlocks = blocks.slice(sentBlockCount);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
        isAtBottomRef.current = isNearBottom;
    };

    // Auto-scroll logic (Smart)
    useEffect(() => {
        if (scrollRef.current && isAtBottomRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [blocks]); // Trigger on any block update

    // Force scroll logic (on Send/Reset)
    useEffect(() => {
        // If the anchor just moved (i.e., we sent data), force scroll to ensure feedback
        // We detect this by seeing if unsentBlocks became empty (meaning we just sent everything/reset)
        // OR simply if sentBlockCount changed, we might want to ensure the divider is visible.
        // The user wants "foolproof".
        // Let's stick to the previous working logic: if sentBlockCount changes, force scroll.
        if (scrollRef.current) {
             scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [sentBlockCount]);

    const renderBlock = (block) => (
        <div key={block.id} className={`transcript-block ${block.speaker.toLowerCase()}`}>
            <div className="speaker-label">{block.speaker === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}</div>
            <div className="brace">{'{'}</div>
            <div className="block-text">{block.text}</div>
            <div className="brace">{'}'}</div>
        </div>
    );

    return (
        <div className="transcript-container">
            <div className="transcript-header">Recommendation (Interviewer ? Candidate)</div>
            
            <div 
                className="transcript-scroll-area" 
                ref={scrollRef}
                onScroll={handleScroll}
            >
                {/* Section 1: Sent History */}
                <div className="sent-section">
                    {sentBlocks.map(renderBlock)}
                </div>

                {/* The Divider - Always Visible */}
                <div className="anchor-divider">
                    <div className="divider-line"></div>
                    <span className="divider-label">SENT HISTORY / NEW CONTENT</span>
                    <div className="divider-line"></div>
                </div>

                {/* Section 2: Unsent Buffer */}
                <div className="unsent-section">
                    {unsentBlocks.map(renderBlock)}
                    
                    {unsentBlocks.length === 0 && (
                        <div className="empty-buffer-message">
                            (Waiting for new transcription...)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationTranscript;
