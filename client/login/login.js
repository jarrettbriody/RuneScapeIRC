//check for valid login values, send post
const handleLogin = (e) => {
    e.preventDefault();
    $("#errorContainer").animate({width:'hide'},350);
    if($("#user").val() == '' || $("pass").val() == ''){
        handleError("Both username and password fields are required.");
        return false;
    }
    console.log($('input[name=_csrf]').val());
    sendAjax('POST',$("#loginForm").attr("action"), $("#loginForm").serialize(),redirect);
    return false;
};

//check for valid signup values, send post
const handleSignup = (e) => {
    e.preventDefault();
    $("#errorContainer").animate({width:'hide'},350);
    if($("#user").val()=='' || $("#pass").val()=='' || $("#pass2").val()==''){
        handleError("All fields are required.");
        return false;
    }
    if($("#pass").val() != $("#pass2").val()){
        handleError("Passwords do not match.");
        return false;
    }
    sendAjax('POST',$("#signupForm").attr("action"), $("#signupForm").serialize(),redirect);
    return false;
};

const NavBar = () => {
    return (
        <div id="navBar">
            <div id="titleContainer"><h1 className="appTitle">RuneScape IRC</h1></div>
            <a href="/login"><img id="logo" src="/assets/img/logo.png" alt="logo" title="Home" /></a>
            <div className="navlink"><a id="loginButton" href="/login">Login</a></div>
            <div className="navlink"><a id="signupButton" href="/signup">Sign up</a></div>
        </div>
    );
};

//create react page for login
const LoginWindow = (props) => {
    return (
        <form id="loginForm" name="loginForm"
            onSubmit={handleLogin}
            action="/login"
            method="POST"
            className="mainForm"
        >
            <h1 className="appTitle">RuneScape IRC</h1>
            <h3 className="signInTitle">Login</h3>
            <div id="loginFormInput">
                <div id="userContainer">
                    <h5>Username:</h5>
                    <input id="user" type="text" name="username" placeholder="username" />
                </div>
                <div id="passContainer">
                    <h5>Password:</h5>
                    <input id="pass" type="password" name="pass" placeholder="password" />
                </div>
            </div>
            <input type="hidden" name="_csrf" value={props.csrf} />
            <input className="formSubmit" type="submit" value="Sign in" />
        </form>
    );
};

//create react page for signup
const SignupWindow = (props) => {
    return (
        <form id="signupForm" name="signupForm"
            onSubmit={handleSignup}
            action="/signup"
            method="POST"
            className="mainForm"
        >
            <h1 className="appTitle">RuneScape IRC</h1>
            <h3 className="signInTitle">Sign up</h3>
            
            <div id="signupFormInput">
                <h5>Username:</h5>
                <input id="user" type="text" name="username" placeholder="username" />
                <h5>Password:</h5>
                <input id="pass" type="password" name="pass" placeholder="password" />
                <h5>Confirm Password:</h5>
                <input id="pass2" type="password" name="pass2" placeholder="confirm password" />
            </div>
            <input type="hidden" name="_csrf" value={props.csrf} />
            <input className="formSubmit" type="submit" value="Sign up" />
        </form>
    );
};

//helper function for creating react pages
const createNavBar = () => {
    ReactDOM.render(
        <NavBar />,
        document.querySelector("nav")
    );
};

const createLoginWindow = (csrf) => {
    ReactDOM.render(
        <LoginWindow csrf={csrf} />,
        document.querySelector("#content")
    );
};

const createSignupWindow = (csrf) => {
    ReactDOM.render(
        <SignupWindow csrf={csrf} />,
        document.querySelector("#content")
    );
};

const setup = (csrf) => {
    createNavBar();

    const loginButton = document.querySelector("#loginButton");
    const signupButton = document.querySelector("#signupButton");

    signupButton.addEventListener("click",(e) => {
        e.preventDefault();
        createSignupWindow(csrf);
        return false;
    });

    loginButton.addEventListener("click", (e) => {
        e.preventDefault();
        createLoginWindow(csrf);
        return false;
    });

    createLoginWindow(csrf);
};

const getToken = () => {
    sendAjax("GET", "/getToken", null, (result) => {
        setup(result.csrfToken);
    });
};

$(document).ready(function(){
    getToken();
});