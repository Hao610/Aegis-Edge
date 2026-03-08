// Landing Page Interactive Script

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('terminalInput');
    const terminalOutput = document.getElementById('terminalOutput');

    // Simulate keywords that trigger malicious detection
    const maliciousKeywords = ['password', 'login', 'urgent', 'verify', 'account', 'suspended', 'free', 'win', 'http://'];

    inputField.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            const userInput = this.value.trim();
            this.value = ''; // clear input

            // Add user input to terminal
            appendLog('user', `> ${userInput}`);

            // Start simulation
            simulateAnalysis(userInput);
        }
    });

    function appendLog(type, text) {
        const p = document.createElement('p');
        p.className = 'log-entry';

        const time = new Date().toISOString().split('T')[1].substring(0, 12);
        const timeSpan = document.createElement('span');
        timeSpan.className = 'timestamp';
        timeSpan.textContent = `[${time}]`;
        p.appendChild(timeSpan);
        p.appendChild(document.createTextNode(' '));

        if (type === 'user') {
            const span = document.createElement('span');
            span.className = 'typing-effect';
            span.textContent = text;
            p.appendChild(span);
        } else if (type === 'system') {
            const span = document.createElement('span');
            span.className = 'sys-msg';
            span.textContent = text;
            p.appendChild(span);
        } else if (type === 'analysis') {
            const span = document.createElement('span');
            span.className = 'analysis-step';
            span.textContent = text;
            p.appendChild(span);
        } else if (type === 'blocked') {
            const span = document.createElement('span');
            span.className = 'threat-blocked glitch';
            span.textContent = 'CRITICAL: PHISHING/SCAM DETECTED. CONNECTION BLOCKED.';
            p.appendChild(span);
            terminalOutput.classList.add('glitch');
            setTimeout(() => terminalOutput.classList.remove('glitch'), 300);
        } else if (type === 'safe') {
            const span = document.createElement('span');
            span.className = 'threat-safe';
            span.textContent = 'STATUS: SAFE. No threats detected.';
            p.appendChild(span);
        }

        terminalOutput.appendChild(p);

        // Auto-scroll
        terminalOutput.parentElement.scrollTop = terminalOutput.parentElement.scrollHeight;
    }

    async function simulateAnalysis(text) {
        appendLog('system', 'Intercepting DOM node... [OK]');

        await sleep(400);
        appendLog('analysis', '[Edge AI] Extracting features & tokenizing strings...');

        await sleep(300);
        appendLog('analysis', '[Edge AI] Running inference on quantized CNN-BiLSTM model...');

        await sleep(250); // Simulating ultra-fast edge execution

        const isMalicious = maliciousKeywords.some(kw => text.toLowerCase().includes(kw));

        if (isMalicious) {
            appendLog('analysis', '[Edge AI] Inference complete. Confidence score: 98.7%');
            await sleep(100);
            appendLog('blocked', '');
        } else {
            appendLog('analysis', '[Edge AI] Inference complete. Confidence score: 0.02%');
            await sleep(100);
            appendLog('safe', '');
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});
