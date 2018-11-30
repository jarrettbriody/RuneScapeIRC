
let currentChannel = "";

//let connection = new WebSocket('wss://runescapeirc.herokuapp.com');
let connection = new WebSocket('ws://127.0.0.1:3000');

// stolen from https://www.quirksmode.org/js/cookies.html ---------------------------------------------------
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}
//-----------------------------------------------------------------------------------------------------------

const handleCreateChannel = (e) => {
    e.preventDefault();
    $("#errorContainer").animate({width:'hide'},350);
    if($("#channelName").val() == ''){
        handleError("Channel name is required.");
        return false;
    }
    document.querySelector("#newChannelForm").action = e.target.action;
    sendAjax('POST',$("#newChannelForm").attr("action"), $("#newChannelForm").serialize(),function(){
        loadChannelsFromServer();
    });
    return false;
};

const onChannelClick = (e, channel) => {
    e.preventDefault();
    console.dir(document.cookie);
    sendAjax('POST','/getSingleChannel', `channelID=${channel._id}&_csrf=${document.querySelector('#hiddenCSRF').innerHTML}`, (data) => {
        currentChannel = channel._id;
        ReactDOM.render(
            <Channel channel={data.channel[0]} />, document.querySelector("#channelSection")
        );
    });
    return false;
};

//send a websocket message based on this clients connection and some content
const handleSendMessage = (e) => {
    const user = readCookie('username');
    const content = {
        username: user,
        content: document.querySelector("#messageInput").value,
        createdDate: Date.now(),
        channelID: currentChannel,
    };
    let stringToSend = JSON.stringify(content);
    console.dir(stringToSend);
    connection.send(stringToSend);
    if(e) e.preventDefault();
    return false;
}

const NavBar = (props) => {
    return (
        <div id="navBar">
            <div id="titleContainer"><h1 className="appTitle">RuneScape IRC</h1></div>
            <a href="/login"><img id="logo" src="/assets/img/logo.png" alt="logo" title="Home" /></a>
            <div class="navlink"><a href="/logout">Log out</a></div>
            <form id="newChannelForm" name="newChannelForm"
                onSubmit={handleCreateChannel}
                action="/createChannel"
                method="POST"
                className="channelForm"
            >
                <h5 className="inputLabels">Channel Name:</h5>
                <input id="channelName" type="text" name="name" placeholder="Task Name" />
                <input id="currentCSRF" type="hidden" name="_csrf" value={props.csrf} />
                <button type="submit" className="formSubmit">Create Channel</button>
            </form>
        </div>
    );
};


//create a single task expanded menu
const Channel = (props) => {
    const channelMessages = props.channel.messages.map((message) => {
        return (
            <div className="message">
                <p>{`${message.createdDate} | ${message.username}: ${message.content}`}</p>
            </div>
        );
    });

    return (
        <div id="channel">
            <div id="channelTitleContainer"><h2 id="channelTitle">{props.channel.name}</h2></div>
            <div id="messages">{channelMessages}</div>
            <form id="sendMessageForm" name="sendMessageForm"
                onSubmit={handleSendMessage}
                className="channelForm"
            >
                <h5 className="inputLabels">Message:</h5>
                <input id="messageInput" type="text" name="message" placeholder="message" />
                <button type="submit" className="formSubmit">Send</button>
            </form>
        </div>
    );
};

//generate the list of all user tasks
const ChannelList = function(props){
    console.dir(props.channels);
    const channelLinks = props.channels.map((channel) => {
        return (
            <div key={channel._id} className="channelLinkContainer">
                <a className="channelLink" href="/getSingleChannel" onClick={(e) => {onChannelClick(e, channel);}}>
                    {channel.name}
                </a>
            </div>
        );
    });

    return (
        <div id="channelList">
            <div id="channelListTitleContainer"><h2 id="channelListTitle">Channels</h2></div>
            {channelLinks}
        </div>
    );
}

//load all of the user tasks from the server
const loadChannelsFromServer = (csrf) => {
    sendAjax('GET','/getChannels',null,(data) => {
        ReactDOM.render(
            <ChannelList channels={data.channels} csrf={csrf} />,
            document.querySelector("#channelListSection")
        );
    });
};

const createChannelListWindow = (csrf) => {
    ReactDOM.render(
        <ChannelList channels={[]} csrf={csrf} />, 
        document.querySelector("#channelListSection")
    );
};

const createNavBar = (csrf) => {
    ReactDOM.render(
        <NavBar csrf={csrf} />,
        document.querySelector("nav")
    );
};

const setup = function(csrf){
    createNavBar(csrf);

    document.querySelector("#hiddenCSRF").innerHTML = csrf;

    createChannelListWindow(csrf);

    loadChannelsFromServer(csrf);

    connection.onmessage = (message) => {
        const messages = document.querySelector('#messages');
        let json = JSON.parse(message.data);
        if(json.username && json.content && json.createdDate) {
            const p = document.createElement('p');
            p.textContent = `${json.time} | ${json.user}: ${json.message}`;
            messages.appendChild(p);
            //updateScroll();
        }
    };
};

const getToken = () => {
    sendAjax("GET", "/getToken", null, (result) => {
        setup(result.csrfToken);
    });
};

$(document).ready(function(){
    getToken();
});