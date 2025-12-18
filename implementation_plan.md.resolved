# Chunking POC Implementation Plan

## Goal Description
Implement a "Chunking" workflow that allows users to capture, preview, and copy segments of the live transcript based on a manual "Anchor". This is useful for "Human-in-the-Loop" workflows where a user wants to periodically grab the latest text.

## User Review Required
> [!NOTE]
> I will add this as a toggleable "Chunking Mode" below the main Control Panel, or as a side panel, to avoid cluttering the main "Diarization" view.
> The "Raw Transcript" will be a flattened, chronological serialization of all channels.

## Proposed Changes

### `src/components`

#### [NEW] [ChunkingPanel.tsx](file:///C:/Users/prakh/.gemini/antigravity/scratch/speechmatics-realtime-app/src/components/ChunkingPanel.tsx)
- **UI**:
    - "Raw Transcript" textarea (ReadOnly).
    - "New Chunk Preview" box.
    - Buttons: Reset Anchor, Copy New Chunk, Peek Chunk.
    - Status indicators: Anchor set/not set, Chunk length.
- **Props**: `transcripts` (raw data).

#### [MODIFY] [SpeechmaticsApp.tsx](file:///C:/Users/prakh/.gemini/antigravity/scratch/speechmatics-realtime-app/src/components/SpeechmaticsApp.tsx)
- Integrate `ChunkingPanel`.
- Add a toggle to show/hide this panel (e.g., "Show Chunking Tools").

### Logic (Inside `ChunkingPanel` or `useChunking`)
- **Linearize**: Convert `Record<string, TranscriptItem[]>` -> `string`.
    - Sort all items by `startTime`.
    - Join `text` with spaces/newlines.
    - *Decision*: Include Speaker Labels? The prompt says "If diarization Labels... keep them".
        - Format: `[S1] Hello world. [S2] Hi.`
- **State**:
    - `fullText`: Derived from props.
    - `anchorIndex`: `number`. Points to the end of the "last copied" text.
- **Actions**:
    - `handleCopy`: `navigator.clipboard.writeText(fullText.slice(anchorIndex))`, `setAnchorIndex(fullText.length)`.
    - `handleReset`: `setAnchorIndex(fullText.length)`.
- **Hotkeys**:
    - `useEffect` listener for `Ctrl+Shift+C` and `Ctrl+Shift+R`.

## Verification Plan

### Manual Verification
1.  **Start App**: Connect to Speechmatics.
2.  **Speak**: Generate some text.
3.  **Peek**: Click "Peek Chunk" -> Verify new text appears in preview.
4.  **Copy**: Click "Copy New Chunk" -> Verify text is in clipboard and "New Chunk" becomes empty.
5.  **Speak More**: Generate new text.
6.  **Verify Anchor**: Ensure only the *new* text is in the next chunk.
7.  **Hotkeys**: Test keyboard shortcuts.
