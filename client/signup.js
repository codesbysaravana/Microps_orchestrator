export const landingSignUp = (
    `
        <div id="landingSignUp" class="landingPage container-card  fade-in-up">   
        <div class="brand-header">
            <div class="status-indicator"></div>
            <h1>MicrOps</h1>
            <p class="subtitle">Provision Account</p>
        </div>

        <form id="signupForm">
            <div class="input-group">
                <label for="signupname">Full Name</label>
                <input type="text" id="signupname" name="name" placeholder="John Doe"><br><br>
            </div>

            <div class="input-group">
                <label for="signupemail">Email Address</label>
                <input type="text" id="signupemail" name="email" placeholder="john@domain.com"><br><br>
            </div>

            <div class="input-group">
                <label for="signuppassword">Password</label>
                <input type="password" id="signuppassword" name="password" placeholder="••••••••"><br><br>
            </div>

            <button type="submit" value="signup" class="btn-primary">Provision User</button>

            <div class="auth-toggle">
                <span>Existing operator?</span>
                <input type="button" class="btn-text" data-route="/login" value="Return to Login">
            </div>
        </form>
    </div>
    `
)