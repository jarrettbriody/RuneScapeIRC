const parseJSON = (xhr, content) => {
    const obj = JSON.parse(xhr.response);
    if(obj.username && obj.message) {
        const p = document.createElement('p');
        p.textContent = `${obj.username}: ${obj.message}`;
        content.appendChild(p);
    }
};

const handleResponse = (xhr) => {
    const content = document.querySelector('#content');
    switch(xhr.status) {
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
    if(xhr.response) parseJSON(xhr, content);
};

const sendPost = (e,nameForm) => {
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

const sendMessage = (e,connection) => {
    let jsonMessage = {user:document.querySelector('#nameField').value, message:document.querySelector('#messageField').value};
    let stringToSend = JSON.stringify(jsonMessage);
    console.dir(stringToSend);
    connection.send(stringToSend);
    e.preventDefault();
    return false;
};

const getRequest = (e, userForm) => {
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

const init = () => {
    var connection = new WebSocket('wss://runescapeirc.herokuapp.com');

    console.dir(connection);

    connection.onopen = () => {
        const content = document.querySelector('#content');
        const p = document.createElement('p');
        p.textContent = 'Connected.';
        content.appendChild(p);
    };

    connection.onerror = (error) => {
        
    };

    connection.onmessage = (message) => {
        const content = document.querySelector('#content');
        let json = JSON.parse(message.data);
        if(json.user && json.message && json.time) {
            const p = document.createElement('p');
            p.textContent = `${json.time} | ${json.user}: ${json.message}`;
            content.appendChild(p);
        }
    };

    document.querySelector('#messageForm').addEventListener('submit', (e) => {
        sendMessage(e,connection);
    });

    window.WebSocket = window.WebSocket || window.MozWebSocket;
};

window.onload = init;