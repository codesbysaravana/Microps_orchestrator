const SERVER = 'http://localhost:5000';

import { routes } from './router.js';

const app = document.getElementById("app");
window.addEventListener("popstate", () => {
    app.innerHTML = routes[window.location.pathname];
});

//navigate using history API
function renderSPA(path) {
    history.pushState({}, "", path);
    const app = document.getElementById('app');
    app.innerHTML = routes[path];
    const pathnow = window.location.pathname;
    console.log(pathnow);
    //if i place the event listeners adding then theyll add on with every single click
}

function attachEvents() {
    // Handle browser back/forward buttons


    //adding listeners once when page loads
    app.addEventListener("click", (e) => {
        if (e.target.dataset.route) {
            renderSPA(e.target.dataset.route);
        }
        if (e.target.id === "chatButton") {
            sendModel(e);
        }
    });

    app.addEventListener("submit", (e) => {
        if (e.target.id === "loginForm") {
            login(e);
        }
        if (e.target.id === "signupForm") {
            signup(e);
        }
        if (e.target.id === "buildJenkinsForm") {
            buildRequest(e);
        }
    });
}

attachEvents();

async function signup(e) {
    e.preventDefault();

    const name = document.getElementById('signupname').value;
    const email = document.getElementById('signupemail').value;
    const pwd = document.getElementById('signuppassword').value;

    if (!email && !pwd) {
        alert("Nothing given");
    } else if (!email) {
        alert("No email given");
    } else if (!pwd) {
        alert("No pwd given");
    } else {
        await signOnBoarding(name, email, pwd);
        console.log("Sent backend");
    }
}

async function login(e) {
    e.preventDefault();
    //const name = document.getElementById('name').value;
    const email = document.getElementById('loginusername').value;
    const pwd = document.getElementById('loginpassword').value;
    if (!email && !pwd) {
        alert("Nothing given");
    } else if (!email) {
        alert("No email given");
    } else if (!pwd) {
        alert("No pwd given");
    } else {
        await sendCredsBack(email, pwd);
        console.log("Sending backend");
    }
}

async function signOnBoarding(name, email, pwd) {
    console.log(name);
    const data = await fetch(`${SERVER}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            email: email,
            password: pwd
        })
    });

    console.log(data);
    const status = await data.json();
    if (data.ok) {
        renderSPA("/login");
    } else {
        alert('Error signing in');
    }
}

async function sendCredsBack(email, pwd) {
    console.log(email);
    const data = await fetch(`${SERVER}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: email,
            password: pwd
        })
    });
    console.log(data);
    if (!data.ok) {
        alert("Invalid");
    }
    else {
        const token = await data.text();
        localStorage.setItem("jwt", token);
        //const res = await data.json(); 
        if (token) {
            alert('success');
            renderSPA("/dashboard");
        }
    }
}

const buildRequest = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt");
    try {
        const repoUrl = document.getElementById("repoUrl").value; //expects a string
        const branch = document.getElementById("branch").value;
        const buildCommand = document.getElementById("buildCommand").value;
        const projectName = document.getElementById("projectName").value;

        const data = JSON.stringify({ repoUrl, branch, buildCommand, projectName });
        renderSPA("/dashboard/logs"); //just push new route thats all
        buildLogs();
        const response = await fetch(`${SERVER}/build`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: data
        });

        console.log("STATUS:", response.status);
        const reply = await response.text();
        console.log(reply);
    } catch (err) {
        console.log(err);
    }
}

/* const userDetails = async () => {
    const request = JSON.stringify({userName, password});
    const auth = btoa(`User:${password}`);
    const res = await fetch(SERVER, { 
        method: 'POST',
        headers: {'Content-type': 'application/json', "Authorization": `Basic ${auth}`},
        body: request
        }
    )

    if(!res.ok) { console.log('error'); }
    else { console.log('successfully sent'); }
} */

const buildLogs = () => {
    const logBox = document.getElementById('buildLogs');
    if (!logBox) return;
    logBox.textContent = "Connecting to Live Stream..."; //textContent for pre
    //for SSE
    const eventSource = new EventSource(`${SERVER}/build/stream`); //fetch with event source

    eventSource.onmessage = (event) => { //get from backend
        const data = JSON.parse(event.data);
        logBox.textContent += `\n${data.message}`;
        logBox.scrollTop = logBox.scrollHeight;

        if (data.message.includes('Successful') || data.message.includes('Failed')) {
            eventSource.close();
        }
    }

    eventSource.onerror = () => {
        console.log("Stream closed or errored.");
        eventSource.close();
    };
}

const sendModel = async (e) => {
    e.preventDefault();
    const userPrompt = document.getElementById('chatInput').value;
    //const prompt = userPrompt.json(); strings dont have any .json() mehod
    const response = await fetch(`${SERVER}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
    });

    const output = document.getElementById('output');
    const data = await response.text();

    output.value = data; //textarea lived in value
}

//need for initial load clearly
renderSPA(window.location.pathname);