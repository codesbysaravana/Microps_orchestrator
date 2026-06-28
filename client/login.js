export const landingLogin = (
    `
        <div id="landingLogin" class="landingPage container-card fade-in-up">   
            <div class="brand-header">
                <div class="status-indicator"></div>
                <h1>MicrOps</h1>
                <p class="subtitle">Platform Authentication</p>
            </div>
            
            <form id="loginForm">
                <div class="input-group">
                    <label for="loginusername">Username or Email</label>
                    <input type="text" id="loginusername" name="username" placeholder="admin@domain.com"><br><br>
                </div>

                <div class="input-group">
                    <label for="loginpassword">Password</label>
                    <input type="password" id="loginpassword" name="password" placeholder="••••••••"><br><br>
                </div>

                <button type="submit" value="Login" class="btn-primary">Authenticate</button>

                <div class="auth-toggle">
                    <span>New operator?</span>
                    <input type="button" class="btn-text" data-route="/signup" value="Request Access">
                </div>
            </form>
    </div>
    `
)

