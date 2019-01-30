'use strict';

//check for valid login values, send post
var handleLogin = function handleLogin(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    // $("#errorContainer").animate({width:'hide'},350);
    if ($("#user").val() == '' || $("pass").val() == '') {
        handleError("Both username and password fields are required.");
        return false;
    }
    console.log($('input[name=_csrf]').val());
    sendAjax('POST', $("#loginForm").attr("action"), $("#loginForm").serialize(), redirect);
    return false;
};

//check for valid signup values, send post
var handleSignup = function handleSignup(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    // $("#errorContainer").animate({width:'hide'},350);
    if ($("#user").val() == '' || $("#pass").val() == '' || $("#pass2").val() == '') {
        handleError("All fields are required.");
        return false;
    }
    if ($("#pass").val() != $("#pass2").val()) {
        handleError("Passwords do not match.");
        return false;
    }
    sendAjax('POST', $("#signupForm").attr("action"), $("#signupForm").serialize(), redirect);
    return false;
};

var NavBar = function NavBar() {
    return React.createElement(
        'div',
        { id: 'navBar' },
        React.createElement(
            'div',
            { id: 'titleContainer' },
            React.createElement(
                'h1',
                { className: 'appTitle' },
                'RuneScape IRC'
            )
        ),
        React.createElement(
            'div',
            { className: 'navlink' },
            React.createElement(
                'a',
                { href: '/login', title: 'Home' },
                React.createElement('i', { className: 'fas fa-home' })
            )
        ),
        React.createElement(
            'div',
            { className: 'navlink' },
            React.createElement(
                'a',
                { id: 'loginButton', href: '/login' },
                React.createElement(
                    'span',
                    { className: 'navlinkText' },
                    'Log in '
                ),
                React.createElement('i', { className: 'fas fa-sign-in-alt' })
            )
        ),
        React.createElement(
            'div',
            { className: 'navlink' },
            React.createElement(
                'a',
                { id: 'signupButton', href: '/signup' },
                React.createElement(
                    'span',
                    { className: 'navlinkText' },
                    'Sign up '
                ),
                React.createElement('i', { className: 'fas fa-user-plus' })
            )
        )
    );
};

//create react page for login
var LoginWindow = function LoginWindow(props) {
    return React.createElement(
        'div',
        { id: 'accountFormContainer' },
        React.createElement(
            'form',
            { id: 'loginForm', name: 'loginForm',
                onSubmit: handleLogin,
                action: '/login',
                method: 'POST',
                className: 'mainForm'
            },
            React.createElement(
                'h1',
                { className: 'appTitle' },
                'RuneScape IRC'
            ),
            React.createElement(
                'h3',
                { className: 'signInTitle' },
                'Login'
            ),
            React.createElement('hr', null),
            React.createElement(
                'div',
                { id: 'loginFormInput' },
                React.createElement(
                    'div',
                    { id: 'userContainer' },
                    React.createElement(
                        'h5',
                        null,
                        'Username:'
                    ),
                    React.createElement('input', { id: 'user', type: 'text', name: 'username', placeholder: 'username' })
                ),
                React.createElement(
                    'div',
                    { id: 'passContainer' },
                    React.createElement(
                        'h5',
                        null,
                        'Password:'
                    ),
                    React.createElement('input', { id: 'pass', type: 'password', name: 'pass', placeholder: 'password' })
                )
            ),
            React.createElement('input', { type: 'hidden', name: '_csrf', value: props.csrf }),
            React.createElement('input', { className: 'formSubmit', type: 'submit', value: 'Sign in' })
        )
    );
};

//create react page for signup
var SignupWindow = function SignupWindow(props) {
    return React.createElement(
        'div',
        { id: 'accountFormContainer' },
        React.createElement(
            'form',
            { id: 'signupForm', name: 'signupForm',
                onSubmit: handleSignup,
                action: '/signup',
                method: 'POST',
                className: 'mainForm'
            },
            React.createElement(
                'h1',
                { className: 'appTitle' },
                'RuneScape IRC'
            ),
            React.createElement(
                'h3',
                { className: 'signInTitle' },
                'Sign up'
            ),
            React.createElement('hr', null),
            React.createElement(
                'div',
                { id: 'signupFormInput' },
                React.createElement(
                    'h5',
                    null,
                    'Username:'
                ),
                React.createElement('input', { id: 'user', type: 'text', name: 'username', placeholder: 'username' }),
                React.createElement(
                    'h5',
                    null,
                    'Password:'
                ),
                React.createElement('input', { id: 'pass', type: 'password', name: 'pass', placeholder: 'password' }),
                React.createElement(
                    'h5',
                    null,
                    'Confirm Password:'
                ),
                React.createElement('input', { id: 'pass2', type: 'password', name: 'pass2', placeholder: 'confirm password' })
            ),
            React.createElement('input', { type: 'hidden', name: '_csrf', value: props.csrf }),
            React.createElement('input', { className: 'formSubmit', type: 'submit', value: 'Sign up' })
        )
    );
};

//helper function for creating react pages
var createNavBar = function createNavBar() {
    ReactDOM.render(React.createElement(NavBar, null), document.querySelector("nav"));
};

var createLoginWindow = function createLoginWindow(csrf) {
    ReactDOM.render(React.createElement(LoginWindow, { csrf: csrf }), document.querySelector("#content"));
};

var createSignupWindow = function createSignupWindow(csrf) {
    ReactDOM.render(React.createElement(SignupWindow, { csrf: csrf }), document.querySelector("#content"));
};

var setup = function setup(csrf) {
    createNavBar();

    var loginButton = document.querySelector("#loginButton");
    var signupButton = document.querySelector("#signupButton");

    signupButton.addEventListener("click", function (e) {
        document.querySelector('#errorContainer').style.display = 'none';
        e.preventDefault();
        createSignupWindow(csrf);
        return false;
    });

    loginButton.addEventListener("click", function (e) {
        document.querySelector('#errorContainer').style.display = 'none';
        e.preventDefault();
        createLoginWindow(csrf);
        return false;
    });

    createLoginWindow(csrf);
};

var getToken = function getToken() {
    sendAjax("GET", "/getToken", null, function (result) {
        setup(result.csrfToken);
    });
};

$(document).ready(function () {
    getToken();
});
'use strict';

var handleError = function handleError(message) {
  console.dir(message);
  document.querySelector('#errorMessage').innerHTML = message;
  // $('#errorContainer').animate({ display: 'block' }, 350);
  document.querySelector('#errorContainer').style.display = 'block';
};

var redirect = function redirect(response) {
  window.location = response.redirect;
};

var sendAjax = function sendAjax(type, action, data, _success) {
  // console.dir(action + " " + data);
  $.ajax({
    cache: false,
    type: type,
    url: action,
    data: data,
    dataType: 'json',
    success: function success(data2, status, xhr) {
      // console.dir(data2);
      // console.dir(status);
      // console.dir(xhr);
      _success(data2, status, xhr);
      if (data2.message) {
        // console.dir(data2.message);
        handleError(data2.message);
      }
    },
    error: function error(xhr, status, _error) {
      var messageObj = JSON.parse(xhr.responseText);
      handleError(messageObj.error);
      // console.dir(messageObj);
    }
  });
};
