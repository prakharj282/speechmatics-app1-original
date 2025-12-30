// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed/Updated. Injecting content scripts...");
    const mani = chrome.runtime.getManifest();
    const contentScripts = mani.content_scripts;

    if (contentScripts) {
        contentScripts.forEach(script => {
            if (script.js && script.js.length > 0) {
                // Convert matches to chrome.tabs.query format or just query all and check url
                // Simple approach: query all and check url
                chrome.tabs.query({ url: script.matches }, (tabs) => {
                    tabs.forEach(tab => {
                        if (!tab.url.startsWith("chrome://")) {
                            chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                files: script.js
                            }).then(() => {
                                console.log("Injected", script.js, "into", tab.url);
                            }).catch(err => {
                                console.log("Injection failed (likely already there or restricted):", err.message);
                            });
                        }
                    });
                });
            }
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Get Tabs Request
    if (request.type === "COPILOT_GET_TABS") {
        const queryOptions = {}; // Query all tabs
        chrome.tabs.query(queryOptions, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error("Background: Tab query failed", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }

            console.log("Background: Querying tabs. Found total:", tabs.length);
            const targets = [];
            const allowedHosts = ["platform.openai.com", "chatgpt.com", "claude.ai", "ai-sandbox.berkeley.edu", "typingmind", "openrouter"];

            tabs.forEach(tab => {
                if (!tab.url) {
                    console.log('Tab ID', tab.id, 'has NO URL (Permission issue? or Restricted URL)');
                } else {
                    try {
                        const url = new URL(tab.url);
                        const isMatch = allowedHosts.some(host => url.hostname.includes(host));

                        if (isMatch) {
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
            sendResponse({ success: true, targets: targets, tabs: targets }); // Sending both for compatibility
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
                text: request.text, autoSubmit: request.autoSubmit
            }, (response) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    sendResponse(response);
                }
            });
        } else {
            sendResponse({ success: false, error: "No target tabId provided" });
        }
        return true; // Keep message channel open
    }

    // 3. Request Payload (Pull)
    if (request.type === "COPILOT_REQUEST_PAYLOAD") {
         console.log("Background received payload request:", request);
         const sourceTabId = sender.tab ? sender.tab.id : null;

         chrome.tabs.query({ url: "http://localhost:5180/*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: "COPILOT_REQUEST_PAYLOAD",
                    kind: request.kind,
                    sourceTabId: sourceTabId
                });
            });
         });
         return true;
    }

});

// --- Command Listener (Hotkeys) ---
chrome.commands.onCommand.addListener((command) => {
    console.log("Command Triggered:", command);

    const forwardTo = (urlPattern) => {
        chrome.tabs.query({ url: urlPattern }, (tabs) => {
            if (tabs && tabs.length > 0) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "TRIGGER_COMMAND",
                        command: command
                    }, (response) => {
                        const err = chrome.runtime.lastError;
                    });
                });
            }
        });
    };

    forwardTo("http://localhost:5173/*");
    forwardTo("http://localhost:5179/*");
    forwardTo("http://localhost:5180/*");
});
