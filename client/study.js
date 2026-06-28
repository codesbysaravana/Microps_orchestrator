function timeout (x) {
setTimeout(() => {
    console.log(x);
}, 3000);
}

const todoDetails = async () => {
    const data = await fetch('https://jsonplaceholder.typicode.com/todos/1', {
        method: 'GET',
        headers: {'Content-type' : 'application/json'}
    });

    console.log(data);
    const fetched = await data.json();
    console.log(fetched);
    console.log(fetched.title);

    timeout(fetched.title);
}

todoDetails();

function a() {
    var a = 100;

    return function y(b) {
        return function o() {
            const c = 100;
            console.log(a, b, c);
        }
    }
}

const c = 2;
const z = a(); //z is a func now
z("HEllooo")();
console.log(a);


function outer() {
    let count = 0;
    return function inner() {
        count++;
        console.log(count);
    }
}
 
let counter = outer();
counter();
counter();

let counter2 = outer(); //new init new counter new closure 
counter2();
counter2();












//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// STALE HIDDEN AND UNHIDING LOGIC -----------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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

function showDashboard() {
    //e.preventDefault();
    const divForBuild = document.querySelectorAll(".buildContainer");
    //divForBuild.classList.remove('hidden');
    divForBuild.forEach(div => {
        div.classList.remove("hidden");
    });
}