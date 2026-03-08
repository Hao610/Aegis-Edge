# 🛡️ Aegis Edge 
**The Zero-Data-Leak Cybersecurity AI. Real-time phishing detection right in your browser.**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![AI](https://img.shields.io/badge/Edge_AI-TensorFlow.js-FF6F00.svg)
![Platform](https://img.shields.io/badge/platform-Chrome_Extension-yellow.svg)

Traditional phishing detection tools send your private emails and browsing data to a centralized cloud for analysis, compromising your privacy. **Aegis Edge changes the paradigm.** By deploying a quantized deep learning classification model directly inside a Manifest V3 Chrome Extension, Aegis Edge parses and evaluates incoming threats locally. Your text, tokens, and browsing behavior *never* leave your device. 

### ✨ Key Highlights
* **🧠 True Edge AI:** Runs a compressed ML model via TensorFlow.js entirely offline.
* **⚡ 12ms Inference:** Lightning-fast threat detection the moment a DOM element renders.
* **🕵️‍♂️ Absolute Privacy:** Serverless architecture means zero cloud data leaks.
* **🌐 Webmail Integration:** Seamlessly intercepts dynamic React/Angular nodes in Gmail, Outlook, and Yahoo without breaking the UI.

---

## 📁 Project Structure

This project is divided into several interconnected phases/components:

```
.
├── dashboard/               # Phase 4: SaaS Threat Dashboard (The Command Center)
│   ├── index.html           # Main dashboard UI
│   ├── styles.css           # Dashboard styling
│   ├── script.js            # Dashboard logic (Map, Table, etc.)
│   └── mock_data.json       # Simulated threat detection data
├── extension/               # Phase 2: Chrome Extension Architecture (The Shield)
│   ├── manifest.json        # Manifest V3 configuration
│   ├── background.js        # Service Worker for extension lifecycle
│   ├── content.js           # DOM parsing and warning injection
│   ├── tf.min.js            # Offline TensorFlow.js library
│   ├── model_inference.js   # Client-side TFJS inference
│   ├── model/               # Quantized TF.js AI Model & Weights
│   ├── icons/               # Extension Assets
│   ├── popup.html           # Simple Extension UI
│   └── styles.css           # Styling for highlighted malicious elements
├── landing_page/            # Phase 3: Viral Landing Page (The Hook)
│   ├── index.html           # High-converting landing page
│   ├── styles.css           # Custom styling and animations
│   └── script.js            # "Hacker Sandbox" terminal simulation
├── model_conversion/        # Phase 1: Edge AI Model Conversion (The Brain)
│   ├── convert_model.py     # Script to convert Keras CNN-BiLSTM to TF.js
│   └── generate_mock_model_browser.html # Fallback in-browser model generator
└── pitch/                   # Phase 5: Pitching & Monetization Strategy
    └── pitch_deck.md        # Comprehensive pitch outline
```

---

## 🚀 How to Install for Developers (Customizing Your Extension)

We want you to customize and extend Aegis Edge! Installing this locally on your machine for testing and modification is incredibly straightforward.

### 1. Load the Extension Unpacked
To run the local, modifiable version of the extension in your browser:
1. Open Google Chrome or Microsoft Edge and navigate to `chrome://extensions/` (or `edge://extensions/`).
2. Toggle **Developer mode** on in the top right corner.
3. Click the **Load unpacked** button.
4. Select the `Aegis Edge/extension` folder from your cloned repository.
5. Navigate to a supported webmail client (Gmail, Outlook, Yahoo) to test the threat interception!

### 2. Modifying the Interface (Frontend & Dashboard)
You can directly preview the landing page or the SaaS Threat Dashboard by launching a generic local static server.

```bash
# Preview Landing Page
cd landing_page
npx serve . 
# Or with Python: python -m http.server 8000

# Preview Dashboard
cd ../dashboard
npx serve .
# Or with Python: python -m http.server 8001
```

### 3. Modifying the AI Model (The Brain)
If you wish to train your own CNN-BiLSTM model or adjust the architecture, check the `model_conversion/` directory:
- We've provided a Python script (`convert_model.py`) to convert Keras models into `tf.js` format using quantization.
- *Alternatively, if you run into Python `tensorflowjs` compatibility issues, simply open `model_conversion/generate_mock_model_browser.html` in Chrome/Edge to generate the model instantly in your browser!*

---

## 🤝 How to Contribute

We welcome open-source contributions from security researchers, AI engineers, and frontend developers! If you want to modify this extension to suit your needs or help improve the global codebase, follow these steps:

1. **Fork the Repository:** Click the "Fork" button at the top-right of this page.
2. **Clone Your Fork:** `git clone https://github.com/YourUsername/Aegis-Edge.git`
3. **Create a Feature Branch:** `git checkout -b feature/AmazingNewFeature`
4. **Commit Your Changes:** `git commit -m 'Add some AmazingNewFeature'`
5. **Push to the Branch:** `git push origin feature/AmazingNewFeature`
6. **Open a Pull Request:** Navigate to the original repository and open a PR with a description of your changes.

**Areas Needing Help:**
* 🎯 **Model Accuracy:** Improving the text processing and vocabulary pipeline for the inference engine.
* 🛡️ **Heuristic Fallbacks:** Adding regex or basic heuristic checks in `content.js` to run *alongside* the ML model.
* 🎨 **Dashboard UI:** Enhancing the Map visualizer in the SaaS Command Center using WebGL.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

*Aegis Edge — Because your browser is the new fortress.*
