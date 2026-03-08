// Aegis Edge - Background Service Worker

// Initialize extension state on install
chrome.runtime.onInstalled.addListener(() => {
    console.log("Aegis Edge installed successfully.");
    chrome.storage.local.set({
        isEnabled: true,
        threatsBlocked: 0,
        scanCount: 0
    });
});

// Listener for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const senderUrl = sender?.url || '';
    const isAllowedSender =
        senderUrl.startsWith('https://mail.google.com/') ||
        senderUrl.startsWith('https://outlook.live.com/') ||
        senderUrl.startsWith('https://mail.yahoo.com/');

    if (request.type === 'THREAT_DETECTED' && isAllowedSender) {
        console.warn("Threat detected by Aegis Edge.");

        // Update threat count in storage
        chrome.storage.local.get(['threatsBlocked'], (result) => {
            const newCount = (result.threatsBlocked || 0) + 1;
            chrome.storage.local.set({ threatsBlocked: newCount });
        });

        // Send a desktop notification
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "Phishing Attack Prevented",
            message: "Aegis Edge detected a potential phishing attempt in your webmail."
        });

        sendResponse({ status: 'ACKNOWLEDGED' });
    } else if (request.type === 'THREAT_DETECTED') {
        sendResponse({ status: 'IGNORED_UNTRUSTED_SENDER' });
    }
    return true;
});
