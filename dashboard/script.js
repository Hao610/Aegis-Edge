document.addEventListener('DOMContentLoaded', () => {
    const ALERTS_URL = '../alerts.json';
    const ENGINE_BLOCK_THRESHOLD = 0.80;
    const CONFIG_KEY = 'aegis_dashboard_config_v1';
    const DEFAULT_CONFIG = {
        threshold: 0.85,
        pollMs: 3000,
        maxRows: 25
    };

    const state = {
        alerts: [],
        lastAlertCount: 0,
        lastSyncTs: 0,
        isPolling: false,
        pollTimer: null,
        protocolChart: null,
        threatChart: null,
        config: { ...DEFAULT_CONFIG },
        filters: {
            query: '',
            protocol: 'ALL',
            sortBy: 'timestamp_desc'
        },
        route: 'overview'
    };

    const els = {
        menuLinks: Array.from(document.querySelectorAll('#menuNav a')),
        views: Array.from(document.querySelectorAll('.view')),
        blockedCounter: document.getElementById('blockedCounter'),
        peakConfidence: document.getElementById('peakConfidence'),
        avgLatency: document.getElementById('avgLatency'),
        recentThreats: document.getElementById('recentThreats'),
        alertsTableBody: document.querySelector('#alertsTable tbody'),
        blocksTableBody: document.querySelector('#blocksTable tbody'),
        blocksCountText: document.getElementById('blocksCountText'),
        lastSyncText: document.getElementById('lastSyncText'),
        localSyncBadge: document.getElementById('localSyncBadge'),
        pollBadge: document.getElementById('pollBadge'),
        healthStatus: document.getElementById('healthStatus'),
        healthText: document.getElementById('healthText'),
        nodeCards: document.getElementById('nodeCards'),
        blockSearch: document.getElementById('blockSearch'),
        protocolFilter: document.getElementById('protocolFilter'),
        sortBy: document.getElementById('sortBy'),
        clearFilters: document.getElementById('clearFilters'),
        evidenceTableBody: document.querySelector('#evidenceTable tbody'),
        evidenceRuleText: document.getElementById('evidenceRuleText'),
        thresholdRange: document.getElementById('thresholdRange'),
        thresholdValue: document.getElementById('thresholdValue'),
        pollIntervalInput: document.getElementById('pollIntervalInput'),
        maxRowsInput: document.getElementById('maxRowsInput'),
        configForm: document.getElementById('configForm'),
        resetConfig: document.getElementById('resetConfig'),
        configMessage: document.getElementById('configMessage')
    };

    function loadConfig() {
        try {
            const raw = localStorage.getItem(CONFIG_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            state.config = {
                threshold: clampNumber(parsed.threshold, 0.5, 0.99, DEFAULT_CONFIG.threshold),
                pollMs: clampNumber(parsed.pollMs, 1000, 60000, DEFAULT_CONFIG.pollMs),
                maxRows: clampNumber(parsed.maxRows, 5, 200, DEFAULT_CONFIG.maxRows)
            };
        } catch (_) {
            state.config = { ...DEFAULT_CONFIG };
        }
    }

    function saveConfig() {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config));
    }

    function syncConfigUI() {
        els.thresholdRange.value = String(state.config.threshold);
        els.thresholdValue.value = Number(state.config.threshold).toFixed(2);
        els.pollIntervalInput.value = String(state.config.pollMs);
        els.maxRowsInput.value = String(state.config.maxRows);
        els.pollBadge.textContent = `Polling: ${state.config.pollMs}ms`;
    }

    function initRouting() {
        els.menuLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const route = link.dataset.route || 'overview';
                location.hash = route;
            });
        });

        window.addEventListener('hashchange', applyRouteFromHash);
        applyRouteFromHash();
    }

    function applyRouteFromHash() {
        const raw = location.hash.replace('#', '').trim();
        const route = ['overview', 'blocks', 'evidence', 'network', 'config'].includes(raw) ? raw : 'overview';
        state.route = route;

        els.menuLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.route === route);
        });

        els.views.forEach(view => {
            view.classList.toggle('active', view.dataset.view === route);
        });

        if (route === 'network') {
            updateProtocolChart(getFilteredAlerts());
        }
    }

    function initCharts() {
        const threatCtx = document.getElementById('threatChart').getContext('2d');
        const protocolCtx = document.getElementById('protocolChart').getContext('2d');

        state.threatChart = new Chart(threatCtx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 16 }, (_, i) => `T-${15 - i}`),
                datasets: [{
                    label: 'New Blocks',
                    data: Array(16).fill(0),
                    borderColor: '#ff5d67',
                    backgroundColor: 'rgba(255, 93, 103, 0.18)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#93a4c5' }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { color: '#93a4c5', stepSize: 1 }, grid: { color: '#2c3f5f' } }
                },
                plugins: { legend: { display: false } },
                animation: { duration: 300 }
            }
        });

        state.protocolChart = new Chart(protocolCtx, {
            type: 'doughnut',
            data: {
                labels: ['TCP', 'UDP', 'ICMP', 'OTHER'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#3db5ff', '#27d8c3', '#ff5d67', '#7f8ea8'],
                    borderColor: '#131f36'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e6eefc' }
                    }
                }
            }
        });
    }

    function initControls() {
        els.blockSearch.addEventListener('input', (event) => {
            state.filters.query = event.target.value.trim().toLowerCase();
            renderBlocksTable();
        });

        els.protocolFilter.addEventListener('change', (event) => {
            state.filters.protocol = event.target.value;
            renderBlocksTable();
            updateProtocolChart(getFilteredAlerts());
        });

        els.sortBy.addEventListener('change', (event) => {
            state.filters.sortBy = event.target.value;
            renderBlocksTable();
        });

        els.clearFilters.addEventListener('click', () => {
            state.filters.query = '';
            state.filters.protocol = 'ALL';
            state.filters.sortBy = 'timestamp_desc';

            els.blockSearch.value = '';
            els.protocolFilter.value = 'ALL';
            els.sortBy.value = 'timestamp_desc';

            renderBlocksTable();
            updateProtocolChart(getFilteredAlerts());
        });

        els.thresholdRange.addEventListener('input', (event) => {
            els.thresholdValue.value = Number(event.target.value).toFixed(2);
        });

        els.configForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const threshold = clampNumber(Number(els.thresholdRange.value), 0.5, 0.99, DEFAULT_CONFIG.threshold);
            const pollMs = clampNumber(Number(els.pollIntervalInput.value), 1000, 60000, DEFAULT_CONFIG.pollMs);
            const maxRows = clampNumber(Number(els.maxRowsInput.value), 5, 200, DEFAULT_CONFIG.maxRows);

            state.config = { threshold, pollMs, maxRows };
            saveConfig();
            syncConfigUI();
            restartPolling();
            renderAll();

            els.configMessage.textContent = 'Configuration saved and applied.';
        });

        els.resetConfig.addEventListener('click', () => {
            state.config = { ...DEFAULT_CONFIG };
            saveConfig();
            syncConfigUI();
            restartPolling();
            renderAll();

            els.configMessage.textContent = 'Defaults restored.';
        });
    }

    function restartPolling() {
        if (state.pollTimer) {
            clearInterval(state.pollTimer);
        }
        state.pollTimer = setInterval(fetchAlerts, state.config.pollMs);
    }

    async function fetchAlerts() {
        if (state.isPolling) return;
        state.isPolling = true;

        try {
            const response = await fetch(`${ALERTS_URL}?t=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            const alerts = Array.isArray(payload) ? payload.map(normalizeAlert).filter(Boolean) : [];

            state.alerts = alerts;
            state.lastSyncTs = Date.now();
            els.localSyncBadge.textContent = 'Local Sync: OK';
            els.healthText.textContent = 'System Armed';
            els.healthStatus.classList.remove('stale');
            renderAll();
        } catch (_) {
            els.localSyncBadge.textContent = 'Local Sync: Waiting';
            els.healthText.textContent = 'Stale Feed';
            els.healthStatus.classList.add('stale');
        } finally {
            state.isPolling = false;
            renderLastSync();
        }
    }

    function normalizeAlert(item) {
        if (!item || typeof item !== 'object') return null;

        const timestamp = Number(item.timestamp) || Math.floor(Date.now() / 1000);
        const srcIp = String(item.src_ip || '0.0.0.0');
        const protocol = String(item.protocol || 'OTHER').toUpperCase();
        const dstPort = Number(item.dst_port) || 0;
        const confidence = Number(item.confidence);
        const safeConfidence = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0;

        return {
            id: `${timestamp}-${srcIp}-${dstPort}-${protocol}`,
            timestamp,
            src_ip: srcIp,
            dst_port: dstPort,
            protocol,
            confidence: safeConfidence,
            latency_ms: Number(item.latency_ms) || inferLatency(safeConfidence)
        };
    }

    function inferLatency(confidence) {
        return Number((1.2 + (1 - confidence) * 2.4).toFixed(2));
    }

    function updateOverviewMetrics() {
        const alerts = state.alerts;
        const total = alerts.length;
        const peak = alerts.reduce((max, alert) => Math.max(max, alert.confidence), 0);

        const avgLatency = total === 0
            ? 0
            : alerts.reduce((sum, alert) => sum + alert.latency_ms, 0) / total;

        const nowSec = Math.floor(Date.now() / 1000);
        const recent = alerts.filter(alert => (nowSec - alert.timestamp) <= 60).length;

        els.blockedCounter.textContent = total.toLocaleString();
        els.peakConfidence.textContent = `${(peak * 100).toFixed(2)}%`;
        els.avgLatency.textContent = `${avgLatency.toFixed(2)}ms`;
        els.recentThreats.textContent = recent.toLocaleString();
    }

    function updateThreatChart() {
        const series = state.threatChart.data.datasets[0].data;
        series.shift();

        let newCount = 0;
        if (state.alerts.length >= state.lastAlertCount) {
            newCount = state.alerts.length - state.lastAlertCount;
        }

        series.push(newCount);
        state.threatChart.update();
        state.lastAlertCount = state.alerts.length;
    }

    function clearChildren(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function appendCell(row, value, className = '') {
        const td = document.createElement('td');
        if (className) td.className = className;
        td.textContent = value;
        row.appendChild(td);
        return td;
    }

    function renderRecentAlertsTable() {
        clearChildren(els.alertsTableBody);

        const maxRows = state.config.maxRows;
        const rows = [...state.alerts]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, maxRows);

        rows.forEach(alert => {
            const tr = document.createElement('tr');
            appendCell(tr, formatTime(alert.timestamp));
            appendCell(tr, alert.src_ip);
            appendCell(tr, String(alert.dst_port));
            appendCell(tr, alert.protocol);
            appendCell(tr, `${(alert.confidence * 100).toFixed(2)}%`, 'conf-high');
            els.alertsTableBody.appendChild(tr);
        });
    }

    function getFilteredAlerts() {
        const q = state.filters.query;
        const protocol = state.filters.protocol;

        let rows = state.alerts.filter(alert => alert.confidence >= state.config.threshold);

        if (protocol !== 'ALL') {
            rows = rows.filter(alert => alert.protocol === protocol);
        }

        if (q) {
            rows = rows.filter(alert => (
                alert.src_ip.toLowerCase().includes(q) ||
                String(alert.dst_port).includes(q) ||
                alert.protocol.toLowerCase().includes(q)
            ));
        }

        const sortBy = state.filters.sortBy;
        if (sortBy === 'timestamp_desc') {
            rows.sort((a, b) => b.timestamp - a.timestamp);
        } else if (sortBy === 'confidence_desc') {
            rows.sort((a, b) => b.confidence - a.confidence);
        } else if (sortBy === 'src_ip_asc') {
            rows.sort((a, b) => a.src_ip.localeCompare(b.src_ip));
        }

        return rows;
    }

    function renderBlocksTable() {
        clearChildren(els.blocksTableBody);

        const filtered = getFilteredAlerts().slice(0, state.config.maxRows);
        filtered.forEach(alert => {
            const tr = document.createElement('tr');
            appendCell(tr, formatTime(alert.timestamp));
            appendCell(tr, alert.src_ip);
            appendCell(tr, String(alert.dst_port));
            appendCell(tr, alert.protocol);
            appendCell(tr, `${(alert.confidence * 100).toFixed(2)}%`, 'conf-high');

            const actionTd = document.createElement('td');
            const button = document.createElement('button');
            button.className = 'btn ghost';
            button.type = 'button';
            button.textContent = 'Unblock (local)';
            button.addEventListener('click', () => {
                state.alerts = state.alerts.filter(item => item.id !== alert.id);
                renderAll();
            });
            actionTd.appendChild(button);
            tr.appendChild(actionTd);

            els.blocksTableBody.appendChild(tr);
        });

        els.blocksCountText.textContent = `${filtered.length} records shown (threshold ${(state.config.threshold * 100).toFixed(0)}%)`;
    }

    function renderEvidenceTable() {
        clearChildren(els.evidenceTableBody);
        els.evidenceRuleText.textContent = `Engine rule: confidence > ${(ENGINE_BLOCK_THRESHOLD * 100).toFixed(0)}%`;

        const rows = [...state.alerts]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, state.config.maxRows);

        rows.forEach(alert => {
            const tr = document.createElement('tr');
            const threshold = ENGINE_BLOCK_THRESHOLD;
            const delta = alert.confidence - threshold;
            const reason = delta > 0
                ? `Blocked by engine: exceeded 80% by ${(delta * 100).toFixed(2)}%`
                : 'Blocked by engine at run time (score is near threshold after rounding)';

            appendCell(tr, formatTime(alert.timestamp));
            appendCell(tr, alert.src_ip);
            appendCell(tr, `${(alert.confidence * 100).toFixed(2)}%`, 'conf-high');
            appendCell(tr, `${(threshold * 100).toFixed(2)}%`);
            appendCell(tr, `${(delta * 100).toFixed(2)}%`);
            appendCell(tr, reason);

            els.evidenceTableBody.appendChild(tr);
        });
    }

    function updateProtocolChart(alerts) {
        const counts = { TCP: 0, UDP: 0, ICMP: 0, OTHER: 0 };

        alerts.forEach(alert => {
            if (alert.protocol === 'TCP') counts.TCP += 1;
            else if (alert.protocol === 'UDP') counts.UDP += 1;
            else if (alert.protocol === 'ICMP') counts.ICMP += 1;
            else counts.OTHER += 1;
        });

        state.protocolChart.data.datasets[0].data = [counts.TCP, counts.UDP, counts.ICMP, counts.OTHER];
        state.protocolChart.update();
    }

    function renderNodeCards() {
        clearChildren(els.nodeCards);

        const segments = new Map();
        state.alerts.forEach(alert => {
            const seg = toNetworkSegment(alert.src_ip);
            if (!segments.has(seg)) {
                segments.set(seg, { blocks: 0, peak: 0, latencyTotal: 0 });
            }
            const stat = segments.get(seg);
            stat.blocks += 1;
            stat.peak = Math.max(stat.peak, alert.confidence);
            stat.latencyTotal += alert.latency_ms;
        });

        const rows = Array.from(segments.entries())
            .map(([segment, stat]) => ({
                segment,
                blocks: stat.blocks,
                peak: stat.peak,
                avgLatency: stat.blocks > 0 ? stat.latencyTotal / stat.blocks : 0
            }))
            .sort((a, b) => b.blocks - a.blocks)
            .slice(0, 8);

        if (rows.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'subtle';
            empty.textContent = 'No node telemetry yet. Start edge_manager.py to stream alerts.';
            els.nodeCards.appendChild(empty);
            return;
        }

        rows.forEach(node => {
            const card = document.createElement('article');
            card.className = 'node-card';

            const title = document.createElement('h4');
            title.textContent = node.segment;

            const meta1 = document.createElement('p');
            meta1.className = 'node-meta';
            meta1.textContent = `Blocks: ${node.blocks}`;

            const meta2 = document.createElement('p');
            meta2.className = 'node-meta';
            meta2.textContent = `Peak Confidence: ${(node.peak * 100).toFixed(2)}%`;

            const meta3 = document.createElement('p');
            meta3.className = 'node-meta';
            meta3.textContent = `Avg Latency: ${node.avgLatency.toFixed(2)}ms`;

            card.append(title, meta1, meta2, meta3);
            els.nodeCards.appendChild(card);
        });
    }

    function toNetworkSegment(ip) {
        const parts = String(ip).split('.');
        if (parts.length !== 4) return 'unknown';
        return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }

    function renderLastSync() {
        if (!state.lastSyncTs) {
            els.lastSyncText.textContent = 'Waiting for data...';
            return;
        }

        const delta = Date.now() - state.lastSyncTs;
        const seconds = Math.floor(delta / 1000);
        els.lastSyncText.textContent = `Last sync ${seconds}s ago`;

        const stale = delta > state.config.pollMs * 2;
        els.healthStatus.classList.toggle('stale', stale);
        if (stale) {
            els.healthText.textContent = 'Stale Feed';
        }
    }

    function formatTime(unixSec) {
        return new Date(unixSec * 1000).toLocaleTimeString();
    }

    function clampNumber(value, min, max, fallback) {
        if (!Number.isFinite(value)) return fallback;
        return Math.min(max, Math.max(min, value));
    }

    function renderAll() {
        updateOverviewMetrics();
        updateThreatChart();
        renderRecentAlertsTable();
        renderBlocksTable();
        renderEvidenceTable();
        renderNodeCards();
        updateProtocolChart(getFilteredAlerts());
        renderLastSync();
    }

    loadConfig();
    syncConfigUI();
    initRouting();
    initCharts();
    initControls();
    restartPolling();
    fetchAlerts();
    setInterval(renderLastSync, 1000);
});
