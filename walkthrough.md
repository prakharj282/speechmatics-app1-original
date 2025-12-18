# Walkthrough - Chunking POC

## Features Added

### Chunking Panel
A new panel below the main transcript view that allows for "Anchor-based" text capture.
- **Flattened Text**: Converts multi-channel, multi-speaker transcripts into a single, linearized text stream for easy copying.
- **Anchor Logic**:
    - **Anchor**: Marks the point in the text that has already been processed/copied.
    - **Buffer**: Shows how many characters are "new" (since the last anchor reset).
- **Controls**:
    - **Copy New Chunk**: Copies only the *new* text to clipboard and advances the anchor.
    - **Peek Chunk**: Previews what will be copied without moving the anchor.
    - **Reset Anchor**: Manually advances the anchor to the end of the current text (skipping everything).

### Hotkeys
Added global keyboard shortcuts for power-users:
- `Ctrl + Shift + C`: Copy New Chunk
- `Ctrl + Shift + R`: Reset Anchor

## Usage Guide
1.  Open the app and start transcribing.
2.  Scroll down to the **Chunking POC** panel.
3.  As text appears, you'll see the **Buffer** count increase.
4.  Press `Ctrl + Shift + C` (or click the button) to copy the buffer. The buffer count will reset to 0.

## Implementation Details
- **Component**: `src/components/ChunkingPanel.tsx`
- **Integration**: Added to `SpeechmaticsApp.tsx`.
- **Logic**: Uses a memoized flat text string derived from the transcript objects, sorting by start time.
