// content.js
// Injected into the React App to bridge postMessage -> chrome.runtime.sendMessage

console.log("Sales Copilot Bridge: Content Script Loaded");

// Visual Confirmation of Injection
// document.title = document.title + " (Bridge Active)";

window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    // 0. PING (Debug)
    if (event.data.type === "COPILOT_PING") {
        console.log("Bridge received PING");
        window.postMessage({ type: "COPILOT_PONG", version: "1.2" }, "*");
    }

    // 1. Send Chunk
    if (event.data.type && event.data.type === "COPILOT_SEND_CHUNK") {
        console.log("Bridge received chunk:", event.data);
        chrome.runtime.sendMessage({
            type: "COPILOT_SEND_CHUNK",
            text: event.data.text,
            tabId: event.data.tabId
        }, (response) => {
             // Optional: Forward success/fail back to window if needed
        });
    }

    // 2. Get Tabs
    if (event.data.type && event.data.type === "COPILOT_GET_TABS") {
        console.log("Bridge requesting tabs list...");
        chrome.runtime.sendMessage({ type: "COPILOT_GET_TABS" }, (response) => {
            if (response && response.success) {
                window.postMessage({
                    type: "COPILOT_TABS_LIST",
                    tabs: response.tabs
                }, "*");
            }
        });
    }
});

// Listen for messages from BACKGROUND and forward to WINDOW (React App)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TRIGGER_COMMAND") {
        console.log("Content Script forwarding command to window:", request.command);
        window.postMessage({
            type: "TRIGGER_COMMAND",
            command: request.command
        }, "*");
    }
});

