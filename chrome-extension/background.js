// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Get Tabs Request
    if (request.type === "COPILOT_GET_TABS") {
        const queryOptions = {}; // Query all tabs
        chrome.tabs.query(queryOptions, (tabs) => {
            console.log("Background: Querying tabs. Found total:", tabs.length);
            const targets = [];
            const allowedHosts = ["platform.openai.com", "chatgpt.com", "claude.ai"];
            
            tabs.forEach(tab => {
                // detailed debugging
                if (!tab.url) {
                    console.log("Tab ID", tab.id, "has NO URL (Permission issue?)");
                } else {
                    try {
                        const url = new URL(tab.url);
                        console.log("Checking Tab:", tab.url);
                        if (allowedHosts.some(host => url.hostname.includes(host))) {
                            console.log("MATCH FOUND:", tab.url);
                            targets.push({
                                id: tab.id,
                                title: tab.title,
                                url: tab.url
                            });
                        }
                    } catch (e) {
                        console.error("URL Parse error", e);
                    }
                }
            });
            console.log("Returning targets:", targets);
            sendResponse({ success: true, tabs: targets });
        });
        return true; // Async response
    }

    // 2. Send Chunk Request
    if (request.type === "COPILOT_SEND_CHUNK") {
        console.log("Background received chunk to send:", request);

        if (request.tabId) {
            // Targeted Send
            chrome.tabs.sendMessage(request.tabId, {
                type: "COPILOT_INJECT_CHUNK",
                text: request.text
            }, (response) => {
                 if (chrome.runtime.lastError) {
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    sendResponse(response);
                }
            });
        } else {
            // Fallback: Legacy "First Tab" logic (for backward compatibility if needed, or error)
             sendResponse({ success: false, error: "No target tabId provided" });
        }
        return true; // Keep message channel open
    }
});

// --- Command Listener (Hotkeys) ---
chrome.commands.onCommand.addListener((command) => {
    console.log("Command Triggered:", command);

    // Forward to localhost
    const forwardTo = (urlPattern) => {
        chrome.tabs.query({ url: urlPattern }, (tabs) => {
            if (tabs && tabs.length > 0) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "TRIGGER_COMMAND",
                        command: command
                    }, (response) => {
                         // Suppress "Receiving end does not exist" if tab is not ready
                         const err = chrome.runtime.lastError;
                         if (err) {
                             // console.log("Ignored connection error", err.message);
                         }
                    });
                });
            }
        });
    };

    forwardTo("http://localhost:5173/*");
    forwardTo("http://localhost:5175/*");
});


