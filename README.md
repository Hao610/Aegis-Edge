# 🛡️ Aegis Edge (Network Intrusion Edition)
**The Zero-Latency Edge Intrusion Detection System (IDS). Detect network anomalies right at the perimeter.**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![AI](https://img.shields.io/badge/AI_Engine-Isolation_Forest-FF6F00.svg)
![Platform](https://img.shields.io/badge/platform-Python_|_HTML-yellow.svg)

Traditional Network Firewalls and IDS tools send exhaustive packet logs to centralized cloud servers (SIEMs) for analysis. This causes massive bandwidth waste, high latency windows, and privacy risks. **Aegis Edge flips the architecture.** 

By deploying an unsupervised machine learning model (Isolation Forest) directly on edge routers or perimeter nodes, Aegis Edge analyzes normalized packet data (Ports, Protocols, TCP Flags, Payload Sizes) in **< 2ms** locally. True decentralized security.

### ✨ Key Highlights
* **🧠 True Edge AI:** Runs a pre-trained scikit-learn anomaly detection model offline, isolating DDoS and port scans instantly.
* **⚡ Ultra-Low Latency:** Parses features and calculates threats in under 2ms per packet.
* **🕵️‍♂️ Decentralized Intelligence Sync:** Strips payloads completely. Securely transmits only anonymized flag data (IP, Confidence Score) asynchronously to central trackers.
* **🌐 NOC Dashboard:** A sleek, local, HTML-based Network Operations Center dashboard monitoring the real-time blocklist.

---

## 📁 Project Architecture

This architecture pipelines raw packets into an AI model, auto-updates localized blocklists, and serves a modern frontend.

```
.
├── data_pipeline.py         # Phase 1: Simulates and normalizes synthetic network packets
├── ai_train.py              # Phase 2: Generates a 10K dataset & trains the Isolation Forest
├── ai_inference.py          # Phase 2: Predicts anomaly probability [0.0 - 1.0] from packets
├── edge_manager.py          # Phase 3: The infinite loop orchestrator (Blocks IPs, REST Sync)
├── alerts.json              # Phase 4: Dynamic JSON bus between Manager and Dashboard
├── blocklist.json           # Phase 4: Local JSON firewall ruleset
└── dashboard/               # Phase 4: NOC Dashboard
    ├── index.html           # Dark-mode HTML interface
    ├── styles.css           # UI Styling
    └── script.js            # Asynchronous JSON polling and Chart.js rendering
```

---

## 🚀 How to Run (Local Deployment)

Running this Edge node simulator is extremely lightweight.

### 1. Prerequisites
Ensure you have Python 3.9+ installed. Install the necessary machine learning libraries:
```bash
pip install numpy scikit-learn joblib
```

### 2. Train the AI Model
Before the engine can detect anomalies, it needs a trained weights file (`edge_anomaly_model.pkl`). Run the training script:
```bash
python ai_train.py
```
*This will generate `edge_anomaly_model.pkl` in your root directory.*

### 3. Start the Edge Orchestrator
Launch the main intrusion detection loop. This script listens to the synthetic pipe, evaluates via AI, updates the blocklist, and syncs to the cloud asynchronously:
```bash
python edge_manager.py
```

### 4. Open the NOC Dashboard
While `edge_manager.py` is running, you can monitor the real-time intercepts via the local dashboard. You **do not** need a backend server for the dashboard!
1. Simply open `dashboard/index.html` in any web browser.
2. The UI will automatically poll `alerts.json` every 3 seconds and update the charts dynamically via Javascript.

---

## 🤝 How to Contribute

We welcome open-source contributions from network architects and AI engineers! 

1. **Fork the Repository:** Click the "Fork" button at the top-right of this page.
2. **Clone Your Fork:** `git clone https://github.com/YourUsername/Aegis-Edge.git`
3. **Commit Your Changes:** `git commit -m 'Add PCAP parsing support'`
4. **Push to the Branch:** `git push origin main`
5. **Open a Pull Request:** Navigate to the original repository and open a PR.

**Areas Needing Help:**
* 🎯 **Raw PCAP Support:** Integrating `scapy` or `pyshark` in `data_pipeline.py` to parse live network interfaces rather than synthetic generated data.
* 🛡️ **IP Tables:** Expanding `block_ip()` in `edge_manager.py` to execute actual local `iptables` or Windows Firewall commands.
* 📊 **Dashboard Enhancements:** Expanding Chart.js to track UDP vs TCP anomalies.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

*Aegis Edge — Defend the perimeter locally.*
