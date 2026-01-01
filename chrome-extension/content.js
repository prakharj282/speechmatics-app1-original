// content.js
// Injected into the React App to bridge postMessage -> chrome.runtime.sendMessage

console.log("Sales Copilot Bridge: Content Script Loaded");

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
            autoSubmit: event.data.autoSubmit,
            tabId: event.data.tabId
        }, (response) => {
             // Optional: Forward success/fail back to window if needed
        });
    }

    // 2. Get Tabs
    if (event.data.type && event.data.type === "COPILOT_GET_TABS") {
        // console.log("Bridge requesting tabs list...");
        try {
            chrome.runtime.sendMessage({ type: "COPILOT_GET_TABS" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Bridge Error: failed to contact background:", chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    // console.log("Bridge received tabs from background:", response.tabs);
                    window.postMessage({
                        type: "COPILOT_TABS_LIST",
                        tabs: response.tabs
                    }, "*");
                } else {
                    console.warn("Bridge: Background returned failure or no tabs", response);
                }
            });
        } catch (e) {
             console.error("Bridge: Exception sending message to background", e);
        }
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

    if (request.type === "COPILOT_REQUEST_PAYLOAD") {
        console.log("Content Script forwarding payload request to window");
        window.postMessage({
            type: "COPILOT_REQUEST_PAYLOAD",
            kind: request.kind,
            sourceTabId: request.sourceTabId
        }, "*");
    }
});
