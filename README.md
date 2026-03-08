# Aegis Edge (Network Intrusion Edition)

Zero-latency edge intrusion detection that runs locally and visualizes threats in a multi-view NOC dashboard.

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![AI](https://img.shields.io/badge/AI_Engine-Isolation_Forest-FF6F00.svg)
![Platform](https://img.shields.io/badge/platform-Python_|_HTML_|_JS-yellow.svg)

## Overview

Traditional IDS pipelines often send large telemetry streams to centralized systems before detection. Aegis Edge performs anomaly scoring locally at the perimeter, then exposes lightweight operational telemetry to a local dashboard.

Core flow:

1. Generate/normalize packet-like data.
2. Score with a trained Isolation Forest model.
3. Update local alert and blocklist JSON files.
4. Render live NOC views from the dashboard.

## Key Highlights

- Local edge AI inference with a pre-trained Isolation Forest.
- Low-latency scoring loop suitable for near-real-time response.
- Local JSON bus (`alerts.json`, `blocklist.json`) for decoupled UI updates.
- Advanced dashboard with routing, filtering, protocol analytics, and runtime configuration.

## Project Structure

```text
.
|-- data_pipeline.py           # Simulates and normalizes synthetic network packets
|-- ai_train.py               # Trains Isolation Forest and writes edge_anomaly_model.pkl
|-- ai_inference.py           # Runs anomaly scoring for packet features
|-- edge_manager.py           # Main orchestration loop (detect, block, sync)
|-- alerts.json               # Alert stream consumed by dashboard
|-- blocklist.json            # Local blocked IP records
|-- dashboard/
|   |-- index.html            # Routed multi-view NOC UI
|   |-- styles.css            # Responsive dashboard styling
|   `-- script.js             # Routing, polling, charts, filtering, settings
`-- README.md
```

## Dashboard Functions

The dashboard now supports fully clickable sidebar routes:

- `#overview`:
  - Shows total blocked count, peak confidence, average latency, and last-minute threats.
  - Displays trend chart (`New Blocks`) and latest intrusion records.
- `#blocks`:
  - Operational triage view for active blocked records.
  - Search by IP/port/protocol, protocol filter, and sorting.
  - Local `Unblock` action removes row from dashboard state only (does not change OS firewall rules).
- `#evidence`:
  - Shows why each record was blocked based on engine rule.
  - Uses engine threshold rule from `edge_manager.py`: `confidence > 0.80`.
  - Columns include confidence, threshold, delta, and human-readable reason.
- `#network`:
  - Protocol distribution doughnut chart (TCP/UDP/ICMP/OTHER).
  - Top `/24` node segment cards with block count, peak confidence, and average latency.
- `#config`:
  - Runtime dashboard controls:
    - Threat threshold used by filtered dashboard views (especially `Active Blocks`).
    - Poll interval for refreshing `alerts.json`.
    - Max rows per table render.
  - Settings persist via `localStorage`.

## Engine Functions

- Threat scoring: `ai_inference.py` computes anomaly confidence for each packet.
- Block decision: `edge_manager.py` blocks when `score > 0.80`.
- Alert write path: blocked packets are appended to `alerts.json`.
- Blocklist write path: unique source IPs are stored in `blocklist.json`.
- Cloud sync simulation: anonymized signal (`node_id`, `suspicious_ip`, `confidence`) is printed as mock API acknowledgement.

## Data Files and Meaning

- `alerts.json`:
  - Event log of blocked packets.
  - Contains timestamp, source IP, destination port, protocol, packet size, and confidence.
- `blocklist.json`:
  - Unique blocked IP addresses.
  - Count can differ from `alerts.json` because one IP may generate multiple blocked events.

## How To Run

### 1. Install Python dependencies

```bash
pip install numpy scikit-learn joblib
```

### 2. Train the model

```bash
python ai_train.py
```

Expected output: `edge_anomaly_model.pkl`

### 3. Start the edge manager

```bash
python edge_manager.py
```

This updates `alerts.json` and `blocklist.json` continuously.

### 4. Serve and open the dashboard (important)

Do not open `dashboard/index.html` directly with `file://`.
The dashboard uses `fetch('../alerts.json')`, which many browsers block in file mode.

Start a local web server from the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/dashboard/
```

Keep `edge_manager.py` running in a separate terminal so `alerts.json` keeps updating.

Notes:

- Dashboard polls `../alerts.json` (default every 3000ms).
- Poll interval, threshold, and max rows can be changed in `Configuration` and are persisted in browser storage.
- If the page is still empty, check browser console (`F12`) for:
  - CORS/file fetch errors
  - `Chart is not defined` (CDN blocked)

## Security Notes

- Dashboard rendering uses DOM-safe text insertion (`textContent`) for dynamic table/card content.
- Keep `alerts.json` and `blocklist.json` local for this demo workflow.
- If you expose the dashboard through a server, add CSP and access controls.

## Known Scope

- Current unblock action is local UI state (demo behavior), not an OS firewall revoke command.
- Data source is synthetic unless you extend `data_pipeline.py` with live capture.

## Contributing

Contributions are welcome. Suggested areas:

- Live packet capture integration (`scapy` / `pyshark`).
- Real firewall integration (Windows Firewall / iptables).
- Backend event streaming (SSE/WebSocket) instead of polling.
- Role-based controls and audit logging for unblock/config actions.

## License

Distributed under the MIT License.
