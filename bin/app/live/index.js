import LiveSession from "./livesession.js";
const session = new LiveSession();
function getInputLoginCredential() {
    return [
        document.getElementById("login:host").value,
        document.getElementById("login:username").value,
        document.getElementById("login:pwd").value
    ];
}
function bindDOMEvents() {
    document.getElementById("login:login").addEventListener("click", event => {
        const login = getInputLoginCredential();
        session.login(login[0], login[1], login[2]);
    });
}
function bindListeners() {
    session.on("login", success => {
        if (success) {
            document.querySelector("div.loginbox > h2").textContent = "Logged in successfully";
            document.body.classList.remove("notlogged");
        }
        else {
            document.querySelector("div.loginbox > h2").textContent = "Failed to login. Please check your login credentials";
        }
    });
}
bindDOMEvents();
bindListeners();