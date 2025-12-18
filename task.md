# Speechmatics Realtime App Enhancement

- [x] Review and Polish UI Components
    - [x] Review `ControlPanel.tsx`
    - [x] Review `TranscriptView.tsx`
    - [x] Apply premium design updates if necessary
- [x] Verify Code Quality
    - [x] Check `useSpeechmatics.ts` for potential improvements (AudioWorklet?)
    - [x] Run lint/build to ensure no errors
- [x] Final Verification
- [x] Implement Chunking POC Features
    - [x] Create `ChunkingPanel` component
    - [x] Implement `useChunking` hook or logic
        - [x] Flatten transcripts to raw text
        - [x] Manage `anchorIndex`
        - [x] Implement `copy` and `reset`
    - [x] Add Hotkeys (`Ctrl+Shift+R`, `Ctrl+Shift+C`)
    - [x] Verify Chunking Workflow
