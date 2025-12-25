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
    }
    
    return { success: false, error: "Unknown host" };
}

function handlePlayground(messageText) {
    const log = (msg) => console.log(`[Playground Adapter] ${msg}`);
    
    // 1. Find Textarea
    let input = document.querySelector('textarea[placeholder*="Message"]');
    if (!input) input = document.querySelector('textarea[placeholder*="Chat"]');
    if (!input) {
        // Fallback: Use the last textarea on page
        const textareas = Array.from(document.querySelectorAll('textarea'));
        input = textareas[textareas.length - 1];
    }
    
    if (!input) return { success: false, error: "Input not found" };
    
    // 2. Set Value (React-safe)
    const proto = Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
        desc.set.call(input, messageText);
    } else {
        input.value = messageText;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    
    // 3. Simple Enter Dispatch (Ctrl+Enter is often safer for Playground)
    setTimeout(() => {
        // Try clicking the specific "Add message" button first
        const buttons = Array.from(document.querySelectorAll('button'));
        const sendBtn = buttons.find(b => b.textContent.trim() === 'Add message' || b.textContent.trim() === 'Run');
        
        if (sendBtn) {
            sendBtn.click();
        } else {
           // Dispatch Enter
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
    
    input.value = messageText;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    
    setTimeout(() => {
        const sendBtn = document.querySelector('[data-testid="send-button"]');
        if (sendBtn) sendBtn.click();
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
    }, 200);

    return { success: true };
}
