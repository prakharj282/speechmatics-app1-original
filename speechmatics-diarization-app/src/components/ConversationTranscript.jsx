import React, { useEffect, useRef, useState } from 'react';

const ConversationTranscript = ({ blocks, sentBlockCount }) => {
    const scrollRef = useRef(null);
    const isAtBottomRef = useRef(true); // Default to true so it scrolls initially

    // Handle user sort-of manual scrolling
    const handleScroll = () => {
        if (!scrollRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // Check if user is near bottom (within 50px)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
        isAtBottomRef.current = isNearBottom;
    };

    // Effect 1: Auto-scroll on new blocks (only if already at bottom)
    useEffect(() => {
        if (scrollRef.current && isAtBottomRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [blocks]); 

    // Effect 2: Force scroll to bottom when anchor is reset/sent
    useEffect(() => {
         if (sentBlockCount === blocks.length && scrollRef.current) {
             scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
         }
    }, [sentBlockCount, blocks.length]);

    return (
        <div className="transcript-container">
            <div className="transcript-header">Recommendation (Interviewer ? Candidate)</div>
            <div 
                className="transcript-scroll-area" 
                ref={scrollRef}
                onScroll={handleScroll}
            >
                {blocks.map((block, index) => {
                    const isAnchorHere = index === sentBlockCount;
                    
                    return (
                        <React.Fragment key={block.id}>
                            {isAnchorHere && (
                                <div className="anchor-line" key={`anchor-${index}`}>
                                    ---------------- SENT UP TO HERE ----------------
                                </div>
                            )}
                            <div className={`transcript-block ${block.speaker.toLowerCase()}`}>
                                <div className="speaker-label">{block.speaker === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}</div>
                                <div className="brace">{'{'}</div>
                                <div className="block-text">{block.text}</div>
                                <div className="brace">{'}'}</div>
                            </div>
                        </React.Fragment>
                    );
                })}
                {/* Anchor at the end if everything is sent */}
                {sentBlockCount === blocks.length && (
                     <div className="anchor-line" key="anchor-end">
                         ---------------- SENT UP TO HERE ----------------
                     </div>
                )}
            </div>
        </div>
    );
};

export default ConversationTranscript;
