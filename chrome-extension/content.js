// content.js
// Injected into the React App to bridge postMessage -> chrome.runtime.sendMessage

console.log("Sales Copilot Bridge: Content Script Loaded");

window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    if (event.data.type && event.data.type === "COPILOT_SEND_CHUNK") {
        console.log("Bridge received chunk:", event.data);

        // Forward to background script
        chrome.runtime.sendMessage({
            type: "COPILOT_SEND_CHUNK",
            mode: event.data.mode,
            text: event.data.text
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Bridge Error:", chrome.runtime.lastError);
            } else {
                console.log("Bridge Response:", response);
            }
        });
    }
});
