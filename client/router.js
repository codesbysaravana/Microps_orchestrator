import { landing } from "./landing.js";
import { landingLogin } from "./login.js";
import { landingSignUp } from "./signup.js";
import { dashboard } from "./dashboard.js";
import { buildStageDeploy } from "./buildToDeploy.js";
import { deploy } from "./deploy.js";
import { aiChat } from "./chat.js";

export const routes = {
    // Standard routes
    "/": landing,
    "/login": landingLogin,
    "/signup": landingSignUp,
    "/dashboard": dashboard,
    "/dashboard/build": buildStageDeploy,
    "/dashboard/deploy": deploy,
    "/dashboard/chat": aiChat,

    // Fallback routes for VS Code Live Server default path
    "/client/index.html": landing,
    "/client/index.html/login": landingLogin,
    "/client/index.html/signup": landingSignUp,
    "/client/index.html/dashboard": dashboard,
    "/client/index.html/dashboard/build": buildStageDeploy,
    "/client/index.html/dashboard/deploy": deploy,
    "/client/index.html/dashboard/chat": aiChat
};

// Since this is a JS object use routes[path] ---> resolves to routes["/login"]