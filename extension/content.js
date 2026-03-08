/**
 * Aegis Edge - Optimized Content Script
 */

const EMAIL_BODY_SELECTOR = 'div[dir="ltr"], div.a3s, div[role="main"], div.allowTextSelection';
let scanQueue = new Set();
let isProcessingQueue = false;

function wrapMaliciousContent(element) {
    if (element.classList.contains('aegis-phishing-alert')) return;

    element.classList.add('aegis-phishing-alert');

    const tooltip = document.createElement('div');
    tooltip.className = 'aegis-tooltip';
    const title = document.createElement('strong');
    title.textContent = 'Aegis Edge Phishing Alert';
    const lineBreak = document.createElement('br');
    const message = document.createTextNode(
        'This content has been flagged as highly suspicious by our on-device AI. Avoid clicking links or downloading attachments.'
    );
    tooltip.append(title, lineBreak, message);

    element.style.position = 'relative';
    element.appendChild(tooltip);
}

// Generates a simple hash to detect if text inside a recycled node changed
function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return hash.toString();
}

async function processScanQueue() {
    if (isProcessingQueue || scanQueue.size === 0) return;
    isProcessingQueue = true;

    for (const element of scanQueue) {
        scanQueue.delete(element);

        // Use textContent to avoid layout thrashing (reflows)
        const text = element.textContent.trim();
        if (!text || text.length < 20) continue;

        const currentHash = hashCode(text);

        // Check if we are already scanning this exact text or have already scanned it
        if (element.dataset.aegisHash === currentHash || element.classList.contains('aegis-scanning')) {
            continue;
        }

        // Apply processing lock
        element.classList.add('aegis-scanning');
        element.dataset.aegisHash = currentHash;

        try {
            // Run inference locally
            // Ensure window.isPhishing is available from model_inference.js
            const isMalicious = await window.isPhishing(text);

            if (isMalicious) {
                wrapMaliciousContent(element);
                chrome.runtime.sendMessage({
                    type: 'THREAT_DETECTED'
                });
            } else {
                // If previously marked as malicious but now safe (due to node recycling), clean it up
                element.classList.remove('aegis-phishing-alert');
                const existingTooltip = element.querySelector('.aegis-tooltip');
                if (existingTooltip) existingTooltip.remove();
            }
        } catch (error) {
            console.error('Aegis Edge inference error:', error);
        } finally {
            // Remove processing lock
            element.classList.remove('aegis-scanning');
        }
    }

    isProcessingQueue = false;
}

// Debounce the observer to prevent locking the main thread
let debounceTimer;
const observer = new MutationObserver((mutations) => {
    clearTimeout(debounceTimer);

    // Quick check to see if any relevant nodes were added before querying the DOM
    let shouldScan = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0 || mutation.type === 'characterData') {
            shouldScan = true;
            break;
        }
    }

    if (shouldScan) {
        debounceTimer = setTimeout(() => {
            const elements = document.querySelectorAll(EMAIL_BODY_SELECTOR);
            elements.forEach(el => scanQueue.add(el));

            // Use requestIdleCallback so we only run AI when browser isn't busy rendering
            if ('requestIdleCallback' in window) {
                requestIdleCallback(processScanQueue);
            } else {
                setTimeout(processScanQueue, 1);
            }
        }, 250); // Wait 250ms after the DOM stops twitching
    }
});

// Initialize
window.addEventListener('load', () => {
    console.log('Aegis Edge Content Script Active.');

    // Initial scan
    const initialElements = document.querySelectorAll(EMAIL_BODY_SELECTOR);
    initialElements.forEach(el => scanQueue.add(el));
    processScanQueue();

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true // Required to catch text changes in recycled React/Angular nodes
    });
});
