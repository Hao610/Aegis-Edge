document.addEventListener('DOMContentLoaded', () => {
    let threatChart;
    let lastAlertCount = 0;
    const ALERTS_URL = '../alerts.json';
    // In a real app we might fetch from a local API, but for this demo 
    // we fetch the statically written JSON file by the edge_manager.

    function initChart() {
        const ctx = document.getElementById('threatChart').getContext('2d');

        // Setup initial dummy data (or empty)
        const initLabels = Array.from({ length: 12 }, (_, i) => `T-${12 - i}s`);
        const initData = Array(12).fill(0);

        threatChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initLabels,
                datasets: [{
                    label: 'Intrusions Blocked',
                    data: initData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ef4444'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8', stepSize: 1 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                animation: { duration: 400 }
            }
        });
    }

    function updateChart(alerts) {
        // Simple logic: Group alerts by minute or simulate a rolling window
        // For visual effect, let's just make the chart bounce based on total count
        const currentData = threatChart.data.datasets[0].data;

        // Shift left
        currentData.shift();

        // Push a random spike if alerts changed, else 0
        if (alerts.length > lastAlertCount) {
            const newThreats = alerts.length - lastAlertCount;
            currentData.push(newThreats + Math.floor(Math.random() * 3)); // Add some noise for the NOC feel
        } else {
            // Decay
            currentData.push(Math.max(0, currentData[currentData.length - 1] - 1));
        }

        threatChart.update();
    }

    function renderTable(alerts) {
        const tbody = document.querySelector('#alertsTable tbody');
        tbody.innerHTML = '';

        // Reverse array to show newest first, pick top 15
        const recentAlerts = [...alerts].reverse().slice(0, 15);

        recentAlerts.forEach((alert, index) => {
            const tr = document.createElement('tr');

            // If it's a completely new alert we haven't rendered before, flash it
            if (index < (alerts.length - lastAlertCount)) {
                tr.className = 'table-row-new';
            }

            const timeStr = new Date(alert.timestamp * 1000).toLocaleTimeString();

            tr.innerHTML = `
                <td>${timeStr}</td>
                <td style="color: #38bdf8">${alert.src_ip}</td>
                <td>${alert.dst_port}</td>
                <td>${alert.protocol}</td>
                <td class="conf-high">${(alert.confidence * 100).toFixed(2)}%</td>
            `;
            tbody.appendChild(tr);
        });

        // Update Counter
        document.getElementById('blockedCounter').innerText = alerts.length.toLocaleString();

        lastAlertCount = alerts.length;
    }

    async function pollAlerts() {
        try {
            // Add cache-busting query param so browser doesn't cache the local JSON
            const response = await fetch(`${ALERTS_URL}?t=${new Date().getTime()}`);
            if (response.ok) {
                const alerts = await response.json();
                renderTable(alerts);
                updateChart(alerts);
            }
        } catch (error) {
            console.warn("Waiting for edge_manager to write alerts.json...");
        }
    }

    // Initialization
    initChart();

    // Initial fetch
    pollAlerts();

    // Poll every 3 seconds
    setInterval(pollAlerts, 3000);
});
