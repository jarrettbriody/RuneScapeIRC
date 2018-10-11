let currentChannel;

//handle the status codes and pass the callback through if applicable
const handleResponse = (xhr, callback) => {
    switch(xhr.status) {
        case 200:
        
        break;
        case 201:
        
        break;
        case 204:
        
        return;
        case 400:
            if(xhr.response){
                let errorJSON = JSON.parse(xhr.response);
                switch(errorJSON.id){
                    case 'invalidChannelParams':
                        document.querySelector("#channelNameField").value = errorJSON.message;
                        break;
                    case 'invalidItemParams':
                        document.querySelector("#itemNameField").value = errorJSON.message;
                        break;
                    default:
                        break;
                }
            }
            break;
        case 404:
        
        break;
        default:
        
        break;
    }
    if(xhr.response){
        callback(JSON.parse(xhr.response));
    }
};

//send a post ajax call based on the passed in parameters
const sendPost = (e,path,formData) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader ('Accept', 'application/json');
    xhr.onload = () => handleResponse(xhr, (data) => {

    });
    xhr.send(formData);
    e.preventDefault();
    return false;
};

//send a websocket message based on this clients connection and some content
const sendMessage = (e,connection, content) => {
    let stringToSend = JSON.stringify(content);
    connection.send(stringToSend);
    if(e) e.preventDefault();
    return false;
};

//make a slightly more complex ajax call to get the list of channels, update the page according to the live channels
const getChannelList = (connection) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/getChannelList');
    xhr.setRequestHeader ('Accept', 'application/json');
    xhr.onload = () => handleResponse(xhr, (data) => {
        //keep track of remaining channels and newly created channels
        let toBeKept = [];
        for(let i = 0; i < data.channels.length; i++){
            if(!document.querySelector("#channelList").querySelector(`#${data.channels[i]}`)){
                let link = document.createElement('a');
                link.innerHTML = data.channels[i];
                link.href = `/${data.channels[i]}`;
                link.id = data.channels[i];
                link.onclick = (e) => {
                    document.querySelector('#messages').innerHTML = "";
                    document.querySelector('#channelHeader').querySelector('h1').innerHTML = e.target.innerHTML;
                    currentChannel = e.target.innerHTML;
                    sendMessage(e, connection, {type:'changeChannel', channel:e.target.innerHTML});
                };
                document.querySelector("#channelList").appendChild(link);
                toBeKept.push(`${data.channels[i]}`);
            }
            else{
                toBeKept.push(`${data.channels[i]}`);
            }
        }
        //delete the channels on the html page if they are no longer live, ie they were deleted
        let elements = [].slice.call(document.querySelector("#channelList").querySelectorAll('a'));
        for(let i = 0; i < elements.length; i++){
            if(!toBeKept.includes(elements[i].id)){
                document.querySelector("#channelList").removeChild(elements[i]);
                if(currentChannel === elements[i].id){
                    currentChannel = "general";
                    document.querySelector('#messages').innerHTML = "";
                    document.querySelector('#channelHeader').querySelector('h1').innerHTML = currentChannel;
                    sendMessage(undefined, connection, {type:'changeChannel', channel:currentChannel});
                }
            }
        }
    });
    xhr.send();
};

//send a get or head ajax call
const getRequest = (e, method, path, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, path);
    xhr.setRequestHeader ('Accept', 'application/json');
    xhr.onload = () => handleResponse(xhr, callback);
    xhr.send();
    e.preventDefault();
    return false;
};

//scroll the chat down when a new message is created
function updateScroll(){
    let messagesDiv = document.querySelector("#messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

//initialization
const init = () => {
    let connection = new WebSocket('wss://runescapeirc.herokuapp.com');
    //let connection = new WebSocket('ws://127.0.0.1:3000');
    currentChannel = 'general';
    getChannelList(connection);
    setInterval(() => {getChannelList(connection);}, 1000);

    document.querySelector("#channelAddButton").onclick = (e) => {
        if(document.querySelector("#channelNameField").value.match(/^[0-9a-zA-Z]+$/)){
            sendPost(e,'/createChannel', `channelName=${document.querySelector("#channelNameField").value}`);
        }
        else{
            document.querySelector("#channelNameField").value = "Letters/numbers only";
            e.preventDefault();
            return false;
        }
    };

    document.querySelector("#channelRemoveButton").onclick = (e) => {
        if(document.querySelector("#channelNameField").value.match(/^[0-9a-zA-Z]+$/)){
            sendPost(e,'/removeChannel', `channelName=${document.querySelector("#channelNameField").value}`);
        }
        else{
            document.querySelector("#channelNameField").value = "Letters/numbers only";
            e.preventDefault();
            return false;
        }
    };

    document.querySelector("#itemForm").addEventListener('submit', (e) => {
        getRequest(e,'GET', `${document.querySelector("#itemForm").action}?${document.querySelector("#itemNameField").name}=${encodeURI(document.querySelector("#itemNameField").value.toLowerCase())}`, (json) => {
            if(json.item){
                document.querySelector("#item").innerHTML = "";
                let newImage = document.createElement("img");
                newImage.src = json.item.icon;
                document.querySelector("#item").appendChild(newImage);
                let newP = document.createElement("p");
                newP.innerHTML = json.item.current.price;
                document.querySelector("#item").appendChild(newP);
            }
        });
    });

    //websocket code, just managing messages
    connection.onopen = () => {
        const content = document.querySelector('#messages');
        const p = document.createElement('p');
        p.textContent = 'Connected.';
        content.appendChild(p);
    };

    connection.onerror = (error) => {
        
    };

    connection.onmessage = (message) => {
        const messages = document.querySelector('#messages');
        let json = JSON.parse(message.data);
        if(json.user && json.message && json.time) {
            const p = document.createElement('p');
            p.textContent = `${json.time} | ${json.user}: ${json.message}`;
            messages.appendChild(p);
            updateScroll();
        }
    };

    document.querySelector('#messageForm').addEventListener('submit', (e) => {
        sendMessage(e,connection, {type: 'message', channel: currentChannel, user:document.querySelector('#nameField').value, message:document.querySelector('#messageField').value});
    });

    window.WebSocket = window.WebSocket || window.MozWebSocket;
};

window.onload = init;