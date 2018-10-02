'use strict';

var parseJSON = function parseJSON(xhr, content) {
    var obj = JSON.parse(xhr.response);
    if (obj.username && obj.message) {
        var p = document.createElement('p');
        p.textContent = obj.username + ': ' + obj.message;
        content.appendChild(p);
    }
};

var handleResponse = function handleResponse(xhr) {
    var content = document.querySelector('#content');
    switch (xhr.status) {
        case 200:

            break;
        case 201:

            break;
        case 204:

            return;
        case 400:

            break;
        case 404:

            break;
        default:

            break;
    }
    if (xhr.response) parseJSON(xhr, content);
};

var sendPost = function sendPost(e, nameForm) {
    /*
    const xhr = new XMLHttpRequest();
    xhr.open(nameForm.getAttribute('method'), nameForm.getAttribute('action'));
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader ('Accept', 'application/json');
    xhr.onload = () => handleResponse(xhr);
    const formData = `name=${nameField.value}&age=${ageField.value}`;
    xhr.send(formData);
    e.preventDefault();
    return false;
    */
};

var sendMessage = function sendMessage(e, connection) {
    var jsonMessage = { user: document.querySelector('#nameField').value, message: document.querySelector('#messageField').value };
    var stringToSend = JSON.stringify(jsonMessage);
    console.dir(stringToSend);
    connection.send(stringToSend);
    e.preventDefault();
    return false;
};

var getRequest = function getRequest(e, userForm) {
    /*
    const xhr = new XMLHttpRequest();
    xhr.open(userForm.querySelector('#methodSelect').value, userForm.querySelector('#urlField').value);
    xhr.setRequestHeader ('Accept', 'application/json');
    xhr.onload = () => handleResponse(xhr);
    xhr.send();
    e.preventDefault();
    return false;
    */
};

var init = function init() {
    var connection = new WebSocket('ws://runescapeirc.herokuapp.com:3000');

    console.dir(connection);

    connection.onopen = function () {
        var content = document.querySelector('#content');
        var p = document.createElement('p');
        p.textContent = 'Connected.';
        content.appendChild(p);
    };

    connection.onerror = function (error) {};

    connection.onmessage = function (message) {
        var content = document.querySelector('#content');
        var json = JSON.parse(message.data);
        if (json.user && json.message && json.time) {
            var p = document.createElement('p');
            p.textContent = json.time + ' | ' + json.user + ': ' + json.message;
            content.appendChild(p);
        }
    };

    document.querySelector('#messageForm').addEventListener('submit', function (e) {
        sendMessage(e, connection);
    });

    window.WebSocket = window.WebSocket || window.MozWebSocket;
};

window.onload = init;
