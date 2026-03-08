document.addEventListener('DOMContentLoaded', async () => {

    // Fetch mock data
    try {
        const response = await fetch('mock_data.json');
        const data = await response.json();

        populateTable(data);
        initHeatmap(data);
        updateSummary(data);

    } catch (error) {
        console.error("Failed to load mock data:", error);
    }

    function populateTable(threats) {
        const tbody = document.querySelector('#threatsTable tbody');

        threats.forEach(t => {
            const tr = document.createElement('tr');

            // Format date
            const date = new Date(t.timestamp).toLocaleString();

            // Format Threat badge
            let badgeClass = 'badge-phishing';
            if (t.threatType === 'Scam') badgeClass = 'badge-scam';
            if (t.threatType === 'Malware Link') badgeClass = 'badge-malware';

            // Format confidence
            const confidenceStr = (t.confidenceScore * 100).toFixed(1) + '%';

            const dateTd = document.createElement('td');
            dateTd.textContent = date;

            const threatTd = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = `badge ${badgeClass}`;
            badge.textContent = String(t.threatType || '');
            threatTd.appendChild(badge);

            const confidenceTd = document.createElement('td');
            confidenceTd.textContent = confidenceStr;

            const targetUriTd = document.createElement('td');
            targetUriTd.style.color = '#94a3b8';
            targetUriTd.textContent = String(t.targetUri || '');

            const actionTd = document.createElement('td');
            actionTd.className = 'status-blocked';
            actionTd.textContent = `BLOCKED ${String(t.action || '')}`;

            tr.append(dateTd, threatTd, confidenceTd, targetUriTd, actionTd);
            tbody.appendChild(tr);
        });
    }

    function buildPopupContent(threatType, confidenceScore) {
        const root = document.createElement('div');
        const title = document.createElement('b');
        title.textContent = `${String(threatType || '')} Blocked`;
        const lineBreak = document.createElement('br');
        const body = document.createTextNode(`Confidence: ${(confidenceScore * 100).toFixed(1)}%`);
        root.append(title, lineBreak, body);
        return root;
    }

    function initHeatmap(threats) {
        // Initialize Leaflet map targeting the 'threatMap' div
        // Centered roughly globally
        const map = L.map('threatMap', {
            center: [20, 0],
            zoom: 2,
            zoomControl: false,
            scrollWheelZoom: false
        });

        // Use a dark-themed tile layer appropriate for cyber dashboards
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Add markers for threats
        threats.forEach(t => {
            // Circle markers to look like a heatmap point
            L.circleMarker([t.lat, t.lng], {
                radius: 8,
                fillColor: "#ef4444",
                color: "#f87171",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.6
            }).addTo(map)
                .bindPopup(buildPopupContent(t.threatType, t.confidenceScore));
        });
    }

    function updateSummary(threats) {
        // Just simulating a random large number mapping + recent records
        const base = 12450;
        document.getElementById('totalThreats').innerText = (base + threats.length).toLocaleString();
    }
});
