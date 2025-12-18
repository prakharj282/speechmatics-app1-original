
export const formatBlock = (block) => {
    const speakerName = block.speaker === 'INTERVIEWER' ? 'Interviewer' : 'Candidate';
    return `${speakerName}\n{\n  ${block.text}\n}`;
};

export const formatHelper = (text) => {
    return `Helper\n{\n  ${text}\n}`;
};

export const buildConversationChunk = (blocks, sentCount) => {
    const unsentBlocks = blocks.slice(sentCount);
    if (unsentBlocks.length === 0) return null;
    return unsentBlocks.map(formatBlock).join('\n\n');
};

export const buildHelperChunk = (helperText) => {
    if (!helperText || !helperText.trim()) return null;
    return formatHelper(helperText);
};

export const buildCombinedChunk = (blocks, sentCount, helperText) => {
    const convChunk = buildConversationChunk(blocks, sentCount);
    const helperChunk = buildHelperChunk(helperText);

    if (!convChunk && !helperChunk) return null;

    let parts = [];
    if (convChunk) {
        // Spec says: "Conversation \n =========== \n ..."
        parts.push("Conversation\n===========\n" + convChunk);
    }
    if (helperChunk) {
        parts.push("Helper\n===========\n" + helperChunk);
    }
    return parts.join('\n\n');
};
