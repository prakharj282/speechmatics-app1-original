// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "COPILOT_SEND_CHUNK") {
        console.log("Background received chunk to send to Playground");

        // Find Playground Tab
        chrome.tabs.query({ url: "https://platform.openai.com/*" }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                console.error("No OpenAI Playground tab found");
                sendResponse({ success: false, error: "No Playground tab open" });
                return;
            }

            // Use the first found tab (should be the active one usually)
            const targetTab = tabs[0];

            // Inject script to update textarea
            chrome.scripting.executeScript({
                target: { tabId: targetTab.id },
                func: injectAndSend,
                args: [request.text]
            }, (results) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    // Check result of the injected function
                    const result = results[0]?.result;
                    sendResponse(result);
                }
            });
        });

        return true; // Keep message channel open for async response
    }
});

function injectAndSend(messageText) {
    // This runs inside the Playground Tab

    const log = (msg) => console.log(`[Copilot Injector] ${msg}`);
    log("Starting injection...");

    // 1. Find Textarea
    // Playground structure changes, try robust selectors
    let input = document.querySelector('textarea[placeholder*="Message"]');
    if (!input) input = document.querySelector('textarea[placeholder*="Chat"]');
    if (!input) {
        // Fallback: look for likely main input
        const textareas = Array.from(document.querySelectorAll('textarea'));
        // Usually the last one or the one with contenteditable
        input = textareas[textareas.length - 1];
    }

    // Last resort: active element?
    if (!input && document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.contentEditable === 'true')) {
        input = document.activeElement;
    }

    if (!input) {
        log("Could not find input textarea");
        return { success: false, error: "Input not found" };
    }

    log("Found input!");

    // 2. Set Value (React-friendly)
    const proto = Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
        desc.set.call(input, messageText);
    } else {
        input.value = messageText;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();

    // 3. Click Send
    // Strategy: Look for submit button in form, or button with specific icons/classes
    // OpenAI often uses specific SVGs or aria-labels

    setTimeout(() => {
        let sendBtn = input.closest('form')?.querySelector('button[type="submit"]');

        if (!sendBtn) {
            // Try aria-label
            sendBtn = document.querySelector('button[aria-label="Send message"]');
        }

        if (!sendBtn) {
            // Try generic "last button in the form wrapper"
            // This is brittle but often works if structure is simple
            const wrapper = input.parentElement;
            if (wrapper) {
                const buttons = wrapper.querySelectorAll('button');
                if (buttons.length > 0) sendBtn = buttons[buttons.length - 1];
            }
        }

        if (sendBtn) {
            log("Found send button, clicking...");
            sendBtn.click();
        } else {
            log("Send button not found, trying Enter...");
            const enterEvent = new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            input.dispatchEvent(enterEvent);
        }
    }, 100); // Tiny delay to let React processing input change happen

    return { success: true };
}
