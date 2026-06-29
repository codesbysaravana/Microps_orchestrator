export const loggingPage = (
    `
    <div id="logging-page" class="fade-in-up" class="terminal-window">
        <div class="logging-header">
            <h2>Live System Build Logs:</h2>
            <div class="status-badge">Monitoring Active</div>
        </div>
        <div class="logging-content">
            <pre id="buildLogs" style="background: #1e1e1e; color: #00ff00; padding: 15px; height: 300px; overflow-y: auto; font-family: monospace;">Waiting for build to start...</pre>
        </div>
    </div>
    `
)

//pre tag exactly as i typed inside it it displays used as okay?...good
//now connect this within the main.js file