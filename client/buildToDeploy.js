export const buildStageDeploy = (
    `
            <div  id="buildStageDeploy" class="buildContainer container-card  fade-in-up">
        <div class="dashboard-header">
            <h2>Pipeline Configuration</h2>
            <div class="status-badge">Node Ops Active</div>
        </div>

        <form id="buildJenkinsForm" class="dashboard-section">  
            <div class="form-grid">
                <div class="input-group">
                    <label for="repoUrl">Repository URL</label>
                    <input type="text" id="repoUrl" name="repoUrl" placeholder="https://github.com/org/repo.git"><br><br>
                </div>

                <div class="input-group">
                    <label for="branch">Target Branch</label>
                    <input type="text" id="branch" name="branch" placeholder="main"><br><br>
                </div>
            </div>

            <div class="form-grid">
                <div class="input-group">
                    <label for="projectName">Project Identifier</label>
                    <input type="text" id="projectName" name="projectName" placeholder="microps-core"><br><br>
                </div>

                <div class="input-group">
                    <label for="buildCommand">Build Command</label>
                    <input type="text" id="buildCommand" name="buildCommand" placeholder="npm run build"><br><br>
                </div>
            </div>

            <input type="submit" class="btn-primary" value="Initialize Build Pipeline">
        </form>
    </div>
    `
)