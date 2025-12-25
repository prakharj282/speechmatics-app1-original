// content_adapter.js
// Runs on the Target Websites (Playground, ChatGPT, Claude)

console.log("Sales Copilot Adapter: Loaded on", window.location.hostname);

// Listen for messages from BACKGROUND
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "COPILOT_INJECT_CHUNK") {
        console.log("Adapter received chunk:", request.text);
        const result = injectAndSend(request.text);
        sendResponse(result);
    }
});

function injectAndSend(messageText) {
    const hostname = window.location.hostname;
    
    // Strategy Pattern
    if (hostname.includes("platform.openai")) {
        return handlePlayground(messageText);
    } else if (hostname.includes("chatgpt")) {
        return handleChatGPT(messageText);
    } else if (hostname.includes("claude")) {
        return handleClaude(messageText);
    } else if (hostname.includes("ai-sandbox.berkeley")) {
        return handleBerkeleySandbox(messageText);
    }
    
    return { success: false, error: "Unknown host" };
}

function handleBerkeleySandbox(messageText) {
    // 1. Find Input
    const input = document.querySelector('#prompt-textarea');
    if (!input) return { success: false, error: "Sandbox Input not found" };

    // 2. Set Value (React compliant)
    const proto = Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
        desc.set.call(input, messageText);
    } else {
        input.value = messageText;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();

    // 3. Submit
    setTimeout(() => {
        const sendBtn = document.querySelector('#send-button');
        if (sendBtn) {
            sendBtn.click();
        } else {
            input.dispatchEvent(new KeyboardEvent('keydown', {
                bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13
            }));
        }
    }, 200);

    return { success: true };
}

function handlePlayground(messageText) {
    let input = document.querySelector('textarea[placeholder*="Message"]');
    if (!input) input = document.querySelector('textarea[placeholder*="Chat"]');
    if (!input) {
        const textareas = Array.from(document.querySelectorAll('textarea'));
        input = textareas[textareas.length - 1];
    }
    
    if (!input) return { success: false, error: "Input not found" };
    
    const proto = Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
        desc.set.call(input, messageText);
    } else {
        input.value = messageText;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    
    setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const sendBtn = buttons.find(b => b.textContent.trim() === 'Add message' || b.textContent.trim() === 'Run');
        if (sendBtn) {
            sendBtn.click();
        } else {
           input.dispatchEvent(new KeyboardEvent('keydown', {
               bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13
           }));
        }
    }, 200);

    return { success: true };
}

function handleChatGPT(messageText) {
    const input = document.querySelector('#prompt-textarea');
    if (!input) return { success: false, error: "ChatGPT Input not found" };
    
    const proto = Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
        desc.set.call(input, messageText);
    } else {
        input.value = messageText;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    
    setTimeout(() => {
        const sendBtn = document.querySelector('[data-testid="send-button"]') || document.querySelector('button[aria-label="Send message"]');
        if (sendBtn) {
            sendBtn.click();
        } else {
             input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 }));
        }
    }, 200);

    return { success: true };
}

function handleClaude(messageText) {
    const input = document.querySelector('div[contenteditable="true"]');
    if (!input) return { success: false, error: "Claude Input not found" };

    input.innerHTML = `<p>${messageText}</p>`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    
    setTimeout(() => {
        const sendBtn = document.querySelector('button[aria-label="Send Message"]');
        if (sendBtn) sendBtn.click();
        else {
            input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 }));
        }
    }, 200);

    return { success: true };
}
