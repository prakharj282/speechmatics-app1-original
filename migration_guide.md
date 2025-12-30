# Migration Guide: Moving to a New Computer

Here is the simplest way to move your **Sales Copilot Bridge** to a new computer and ensure it works perfectly.

## 1. Prepare the Files (On OLD Computer)
1.  Locate your project folder (The one containing `speechmatics-diarization-app` and `chrome-extension`).
2.  Copy this **ENTIRE folder** to a USB drive or Cloud Storage (Google Drive/Dropbox).
    *   *Tip:* You can skip the `node_modules` folder inside `speechmatics-diarization-app` to save space/time. The app will reinstall it automatically if missing.

## 2. Setup (On NEW Computer)
1.  **Paste the Folder**: Copy the folder from your USB/Cloud to your new computer (e.g., onto the Desktop).
2.  **Install Node.js**:
    *   This is the only "installation" required.
    *   Download and install the "LTS" version from: [nodejs.org](https://nodejs.org/)
    *   *Note:* IF you don't do this, the black window will close immediately with an error.

## 3. Activate Extension
1.  Open Chrome on the new computer.
2.  Go to `chrome://extensions`.
3.  Turn on **Developer Mode** (top right).
4.  Click **Load unpacked**.
5.  Select the `chrome-extension` folder inside your copied project folder.
6.  *Done! The extension is now installed.*

## 4. Run the App
1.  Open your project folder.
2.  Double-click **`start_app.bat`**.
3.  **First Run Only**: It might say "Installing dependencies..." and take 1-2 minutes. Let it finish.
4.  Once done, the black window will stay open and your browser will launch the app.
5.  **Test**: Open a tab (e.g., Google or OpenAI) and check the "Target" dropdown in your app.

## Summary Checklist
- [ ] Install Node.js on new PC?
- [ ] Load Extension in Chrome?
- [ ] Double-click `start_app.bat`?

**That's it! it is designed to be self-repairing.**
