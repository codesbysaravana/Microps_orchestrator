export const aiChat = (
    `
        <div id="chatLLM" class="dashboard-section console-section">
            <div class="console-header">
                <label for="chatInput">Command Input</label>
            </div>
            <div class="console-input-row">
                <input type="text" id="chatInput" name="chatInput" placeholder="> Enter operational query...">
                <button class="btn-secondary" id="chatButton">Execute</button>
            </div>
            
            <div class="console-output-wrapper">
                <label for="output" class="sr-only">System Output Log</label>
                <textarea id="output" rows="10" cols="50" readonly placeholder="Awaiting system response..."></textarea>
            </div>
        </div>
    `
)