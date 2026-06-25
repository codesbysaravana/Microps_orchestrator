const SERVER = 'http://localhost:5000';

//const landing = document.getElementById('landing');
//landing.addEventListener('click', showDashboard);

const showSignupPage = () => {
    document.getElementById('landing').classList.add('hidden');
    const loginFormHide = document.getElementById('landingLogin');
    loginFormHide.classList.add("hidden");

    const landingSignUp = document.getElementById('landingSignUp');
    landingSignUp.classList.remove("hidden");
}

const showLoginPage = () => {
    document.getElementById('landing').classList.add('hidden');
    const loginFormShow = document.getElementById('landingLogin');
    loginFormShow.classList.remove("hidden");

    const landingSignUp = document.getElementById('landingSignUp');
    landingSignUp.classList.add("hidden");
}

const hideAll = () => {
    const landingSignUp = document.getElementById('landingSignUp');
    landingSignUp.classList.add("hidden");

    const loginFormHide = document.getElementById('landingLogin');
    loginFormHide.classList.add("hidden");
}

const signupForm = document.getElementById('signupForm');

async function signup(e) {
    e.preventDefault();

    const name = document.getElementById('signupname').value;
    const email = document.getElementById('signupemail').value;
    const pwd = document.getElementById('signuppassword').value;
    
    if(!email && !pwd) {
        alert("Nothing given");
    } else if(!email) {
        alert("No email given");
    } else if(!pwd) {
        alert("No pwd given");
    } else {
        await signOnBoarding(name, email, pwd);
        console.log("Sent backend");
    }
} 

signupForm.addEventListener("submit", signup);

const loginForm = document.getElementById('loginForm');
async function login(e) {
    e.preventDefault();
    //const name = document.getElementById('name').value;
    const email = document.getElementById('loginusername').value;
    const pwd = document.getElementById('loginpassword').value;
    if(!email && !pwd) {
        alert("Nothing given");
    } else if(!email) {
        alert("No email given");
    } else if(!pwd) {
        alert("No pwd given");
    } else {
        await sendCredsBack(email, pwd);
        console.log("Sent backend");
    }
}

loginForm.addEventListener('submit', login);

async function signOnBoarding(name, email, pwd) {
    console.log(name);
    const data = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: name,
            email: email,
            password: pwd
        })
    });

    console.log(data);
    const status = await data.json();
    if(data.ok) {
        showLoginPage();
    } else {
        alert('Error signing in');
    }
}

async function sendCredsBack(email, pwd) {
    console.log(email);
    const data = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: email,
            password: pwd
        })
    });
    console.log(data);
    if(!data.ok) {
        alert("Invalid");
    }
    else {
        const token = await data.text();
    localStorage.setItem("jwt", token);
    //const res = await data.json(); 
    if(token) {
        hideAll();
        showDashboard();
        }
    }
} 

function showDashboard() {
    //e.preventDefault();
    const divForBuild = document.querySelectorAll(".buildContainer");
    //divForBuild.classList.remove('hidden');
    divForBuild.forEach(div => {
        div.classList.remove("hidden");
    });
}


/* setTimeout(() => {
    header.textContent = "MICROOOOPSSS";
}, 3000); */

const form = document.getElementById('buildJenkinsForm');
const buildRequest = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt");
    try {
            const repoUrl = document.getElementById("repoUrl").value; //expects a string
            const branch = document.getElementById("branch").value;
            const buildCommand = document.getElementById("buildCommand").value;
            const projectName = document.getElementById("projectName").value;

        const data = JSON.stringify({ repoUrl, branch, buildCommand, projectName });

        const response = await fetch('http://localhost:5000/build', {
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
form.addEventListener('submit', (e) => buildRequest(e));

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

const sendModel = async (e) => {
    e.preventDefault();
    const userPrompt = document.getElementById('chatInput').value;
    //const prompt = userPrompt.json(); strings dont have any .json() mehod
    const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type' : 'application/json' },
        body: JSON.stringify({prompt: userPrompt})
    });

    const output = document.getElementById('output');
    const data = await response.text();

    output.value = data; //textarea lived in value
}
//studentbuilders@amazon.com




