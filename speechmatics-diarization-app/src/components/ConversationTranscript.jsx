import React, { useEffect, useRef } from 'react';

const ConversationTranscript = ({ blocks, sentBlockCount, error }) => {
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
            {/* Error Bar within the Transcript Container */}
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
                    <span style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>{error}</span>
                </div>
            )}

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
