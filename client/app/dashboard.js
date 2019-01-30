
let currentChannel = "";

let connection = new WebSocket('wss://runescapeirc.herokuapp.com');
//let connection = new WebSocket('ws://127.0.0.1:3000');

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

//ajax function for creating a new channel
const handleCreateChannel = (e) => {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    // $("#errorContainer").animate({width:'hide'},350);
    if($("#channelName").val() == ''){
        handleError("Channel name is required.");
        return false;
    }
    document.querySelector("#newChannelForm").action = e.target.action;
    sendAjax('POST',$("#newChannelForm").attr("action"), $("#newChannelForm").serialize(),function(){
        onManageChannelClick();
    });
    return false;
};

//ajax function for getting the cost of a runescape item
const getRSItem = (e) => {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    // $("#errorContainer").animate({width:'hide'},350);
    if($("#itemNameField").val() == ''){
        handleError("Item name is required.");
        return false;
    }
    // console.dir($("#itemForm").serialize());
    sendAjax('POST',$("#itemForm").attr("action"), $("#itemForm").serialize(),function(json){
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
    return false;
};

//check to see if the passwords entered are valid
const handleChangePassword = (e) => {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    // $("#errorContainer").animate({width:'hide'},350);
    if($("#oldPass").val()=='' || $("#pass").val()=='' || $("#pass2").val()==''){
        handleError("All fields are required.");
        return false;
    }
    if($("#pass").val() != $("#pass2").val()){
        handleError("Passwords do not match.");
        return false;
    }
    sendAjax('POST',$("#changePasswordForm").attr("action"), $("#changePasswordForm").serialize(),function(){
        onProfileClick();
    });
    return false;
};

//ajax function for swapping channels when clicked
const onChannelClick = (e, channel) => {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    let addedWSMessages = document.querySelectorAll('.addedWSMessage');
    for(let i = 0; i < addedWSMessages.length; i++){
        console.dir("removing ws message");
        addedWSMessages[i].parentNode.removeChild(addedWSMessages[i]);
    }
    connection.send(JSON.stringify({action:"CHANGE_CHANNEL", channelID: channel._id}));
    sendAjax('POST','/getSingleChannel', `channelID=${channel._id}&_csrf=${document.querySelector('#hiddenCSRF').innerHTML}`, (data) => {
        currentChannel = channel._id;
        ReactDOM.render(
            <Channel channel={data.channel[0]} />, document.querySelector("#channelSection")
        );
    });
    return false;
};

//ajax function for getting the list of channels to be edited
const onManageChannelClick = (e) => {
    document.querySelector('#errorContainer').style.display = 'none';
    if(e){
        e.preventDefault();
    }
    sendAjax('GET','/getChannels',null,(data) => {
        ReactDOM.render(
            <EditChannelList channels={data.channels} csrf={document.querySelector('#hiddenCSRF').innerHTML} />,
            document.querySelector("#content")
        );
    });
    return false;
};

//ajax function for getting unaccepted channel invites
const onChannelInvitesClick = (e) => {
    document.querySelector('#errorContainer').style.display = 'none';
    if(e){
        e.preventDefault();
    }
    sendAjax('GET','/getChannels',null,(data) => {
        ReactDOM.render(
            <ChannelInvites channels={data.channels} csrf={document.querySelector("#hiddenCSRF").innerHTML} />, 
            document.querySelector("#content")
        );
    });
    return false;
};

//react function for setting up profile page
const onProfileClick = (e) => {
    document.querySelector('#errorContainer').style.display = 'none';
    if(e) e.preventDefault();
    ReactDOM.render(
        <Profile />,
        document.querySelector("#content")
    );
    return false;
};

//react function for setting up runescape tools page
const onRuneScapeToolsClick = (e) => {
    document.querySelector('#errorContainer').style.display = 'none';
    if(e) e.preventDefault();
    ReactDOM.render(
        <RuneScapeTools />,
        document.querySelector("#content")
    );
    return false;
};

//ajax function for deleting a channel
const onChannelRemove = (e, channel) => {
    document.querySelector('#errorContainer').style.display = 'none';
    sendAjax('POST','/removeChannel',`channelID=${channel._id}&_csrf=${document.querySelector('#hiddenCSRF').innerHTML}`,(data) => {
        onManageChannelClick();
    });
};

//ajax function for responding to an invite
const inviteResponse = (e, channel, accept) => {
    document.querySelector('#errorContainer').style.display = 'none';
    sendAjax('POST','/inviteResponse',`channelID=${channel._id}&accepted=${accept}&_csrf=${document.querySelector('#hiddenCSRF').innerHTML}`,(data) => {
        onChannelInvitesClick();
    });
};

//ajax function for leaving an unowned channel
const onChannelLeave = (e, channel) => {
    document.querySelector('#errorContainer').style.display = 'none';
    sendAjax('POST','/leaveChannel',`channelID=${channel._id}&_csrf=${document.querySelector('#hiddenCSRF').innerHTML}`,(data) => {
        onManageChannelClick();
    });
};

//ajax function for sending a channel invite
const onSendInvite = (e, channel, username) => {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    sendAjax('POST','/inviteUser',`channelID=${channel._id}&username=${username}&_csrf=${document.querySelector('#hiddenCSRF').innerHTML}`,(data) => {
        onManageChannelClick();
    });
    return false;
};

//send a websocket message based on this clients connection and some content
const handleSendMessage = (e) => {
    const user = readCookie('username');
    const content = {
        action:"SEND_MESSAGE",
        username: user,
        content: document.querySelector("#messageInput").value,
        createdDate: Date.now(),
        channelID: currentChannel,
    };
    let stringToSend = JSON.stringify(content);
    connection.send(stringToSend);
    if(e) e.preventDefault();
    return false;
}

//react content for navbar
const NavBar = (props) => {
    return (
        <div id="navBar">
            <div id="titleContainer"><h1 className="appTitle">RuneScape IRC</h1></div>
            <div className="navlink"><a href="/login" title="Home"><i className="fas fa-home"></i></a></div>
            <div className="navlink"><a href="/logout" title="Log out"><span className="navlinkText">Log out </span><i className="fas fa-sign-out-alt"></i></a></div>
            <div className="navlink" id="profileLink"><a href="#" title="Your profile" onClick={(e) => { onProfileClick(e); }}><span className="navlinkText">Profile </span><i className="fas fa-user-circle"></i></a></div>
            <div className="navlink" id="toolLink"><a href="#" title="RuneScape Tools" onClick={(e) => { onRuneScapeToolsClick(e); }}><span className="navlinkText">RuneScape Tools</span></a></div>
        </div>
    );
};


//create the channel react portion for sending messages and seeing them
const Channel = (props) => {
    const channelMessages = props.channel.messages.map((message) => {
        // console.dir(message.createdDate);
        const date = new Date(parseInt(message.createdDate));
        return (
            <div className="message">
                <p>{`${date.toLocaleDateString()} - ${date.toLocaleTimeString()} | ${message.username}: ${message.content}`}</p>
            </div>
        );
    });

    return (
        <div id="channel">
            <div id="channelTitleContainer"><h2 id="channelTitle">{props.channel.name}</h2></div>
            <div id="messages">
                {props.channel.messages.length > 0 && channelMessages}
                {props.channel.messages.length === 0 && <p className="emptyChannelP">It's quiet in here... Why don't you start chatting by sending a message below?</p>}
            </div>
            <form id="sendMessageForm" name="sendMessageForm"
                onSubmit={handleSendMessage}
                className="channelForm"
            >
                <label for="message" className="inputLabels">Message:  </label>
                <input id="messageInput" type="text" name="message" placeholder="message" />
                <button type="submit" className="formSubmit">Send</button>
            </form>
        </div>
    );
};

//generate the password change form
const ChangePassword = (props) => {
    return (
        <div id="accountFormContainer">
            <form id="changePasswordForm" name="changePasswordForm"
                onSubmit={(e) => {handleChangePassword(e);}}
                action="/changePassword"
                method="POST"
                className="mainForm"
            >
                <h1 className="appTitle">RuneScape IRC</h1>
                <h3 className="signInTitle">Change Password</h3>
                <hr />
                <div id="changePasswordFormInput">
                    <div id="oldPassContainer">
                        <h5>Current Password:</h5>
                        <input id="oldPass" type="password" name="oldPass" placeholder="password" />
                    </div>
                    <div id="newPassContainer1">
                        <h5>New Password:</h5>
                        <input id="pass" type="password" name="pass" placeholder="password" />
                    </div>
                    <div id="newPassContainer2">
                        <h5>Confirm New Password:</h5>
                        <input id="pass2" type="password" name="pass2" placeholder="confirm password" />
                    </div>
                </div>
                <input type="hidden" name="_csrf" value={props.csrf} />
                <input id="changePassButton" className="formSubmit" type="submit" value="Change Password" />
            </form>
        </div>
    );
};

//profile react page
const Profile = () => {
    return (
        <div id="profile">
            <div id="profileLinksContainer">
                <div className="navlink"><a href="#" onClick={(e) => { onManageChannelClick(e); }}>Manage Channels</a></div>
                <div className="navlink"><a href="#" onClick={(e) => { onChannelInvitesClick(e); }}>Channel Invites</a></div>
                <div className="navlink"><a href="#" onClick={(e) => { createChangePasswordWindow(e); }}>Change Password</a></div>
            </div>
            <div id="profileRow1">
                <div id="profileImgContainer"><img id="profileImg" src="/assets/img/profile.png" alt="profile picture" /></div>
                <div id="profileUserDescContainer">
                    <h2 id="profileUsername">{readCookie('username')}</h2>
                    <hr />
                    <p id="profileDescription">This is a placeholder description! Welcome to my profile, I'm a happy, go-lucky person who likes long walks on the beach and candle lit dinners!</p>
                </div>
            </div>
        </div>
    );
};

//runescape tools react page
const RuneScapeTools = () => {
    return (
        <div id="runeScapeTools">
            <section id="itemPriceSection">
                <form id="itemForm" onSubmit={(e) => {getRSItem(e);}} action="/getItem" method="POST">
                    <h3 className="signInTitle">Item Cost Checker</h3>
                    <hr />
                    <input id="itemNameField" type="text" name="itemName" placeholder="Item Name" />
                    <input id="currentCSRF" type="hidden" name="_csrf" value={document.querySelector("#hiddenCSRF").innerHTML} />
                    <input type="submit" value="Get Item Price" />
                </form>
                
                <div id="itemContainer"><div id="item"></div></div>
            </section>
        </div>
    );
};

//generate the list of all channels
const ChannelList = function(props){
    let isNotMember = true;
    for(let i = 0; i < props.channels.length; i++){
        if(props.channels[i].accepted){
            isNotMember = false;
            break;
        }
    }
    const channelLinks = props.channels.map((channel) => {
        if(channel.accepted){
            return (
                <p key={channel._id} className="channelLinkContainer">
                    <a className="channelLink" href="/getSingleChannel" onClick={(e) => {onChannelClick(e, channel);}}>
                        {channel.name}
                    </a>
                </p>
            );
        }
    });

    return (
        <div id="channelList">
            <div id="channelListTitleContainer"><h2 id="channelListTitle">Channels</h2></div>
            { !isNotMember &&
                <div id="channels">{channelLinks}</div> 
            }
            { isNotMember &&
                <div id="channels"><p>It appears that you are not a member of any channels. Click the profile button in the top right to manage your channels.</p></div> 
            }
        </div>
    );
}

//react page for channels that are owned or that the user is apart of
const EditChannelList = function(props){
    let isNotMember = true;
    for(let i = 0; i < props.channels.length; i++){
        if(props.channels[i].accepted){
            isNotMember = false;
            break;
        }
    }
    const channels = props.channels.map((channel) => {
        if(channel.accepted){
            return (
                <div className="editChannel">
                    <div id="editChannelNameContainer"><p>{channel.name}</p></div>
                    <hr />
                    <div id="editChannelFormContainer">
                        <form id="addUserForm" 
                            name="addUserForm"
                            method="POST"
                            action="/inviteUser"
                            onSubmit={(e) => { onSendInvite(e,channel,e.target.parentNode.querySelector('#userInput').value); }}
                            className="addUserForm"
                        >
                            <label for="username" className="inputLabels">Invite User:  </label>
                            <input id="userInput" type="text" name="username" placeholder="username" />
                            <input id="currentCSRF" type="hidden" name="_csrf" value={document.querySelector("#hiddenCSRF").innerHTML} />
                            <input id="currentChannelID" type="hidden" name="channelID" value={channel._id} />
                            <button type="submit" className="formSubmit">Send Invite</button>
                        </form>
                    </div>
                    {
                        !channel.owner && 
                        <div>
                            <hr />
                            <div id="editChannelButtonContainer"><button className="formSubmit" onClick={(e) => { onChannelLeave(e, channel); }}>Leave Channel</button></div>
                        </div>
                    }
                    {channel.owner &&
                        <div>
                            <hr />
                            <div id="editChannelButtonContainer"><button className="formSubmit" onClick={(e) => { onChannelRemove(e, channel); }}>Delete Channel</button></div>
                        </div>
                    }
                    
                </div>
            );
        }
    });

    return(
        <div id="editChannelsContainer">
            <p id="pageTitle">Your Channels</p>
            <form id="newChannelForm" name="newChannelForm"
                onSubmit={handleCreateChannel}
                action="/createChannel"
                method="POST"
                className="channelForm"
            >
                <label for="name" className="inputLabels">Channel Name:  </label>
                <input id="channelName" type="text" name="name" placeholder="channel name" />
                <input id="currentCSRF" type="hidden" name="_csrf" value={props.csrf} />
                <button type="submit" className="formSubmit">Create Channel</button>
            </form>
            <hr />
            { !isNotMember &&
                channels
            }
            { isNotMember &&
                <p id="emptyEditChannels">It appears that you are not a member of any channels. Create a new channel above to get started.</p>
            }
        </div>
    );
}

//react page for channel invites
const ChannelInvites = function(props){
    let isInvites = false;
    for(let i = 0; i < props.channels.length; i++){
        if(!props.channels[i].accepted){
            isInvites = true;
            break;
        }
    }
    const channels = props.channels.map((channel) => {
        if(!channel.accepted){
            return (
                <div className="channelInvite">
                    <div id="channelInviteNameContainer"><p>{channel.name}</p></div>
                    <div id="invButtons">
                        <div id="acceptInviteButtonContainer"><button className="formSubmit" onClick={(e) => { inviteResponse(e, channel, true); }} title="Accept invite"><img className="addRemoveButtonImg" src="/assets/img/plus.png" alt="Accept" /></button></div>
                        <div id="declineInviteButtonContainer"><button className="formSubmit" onClick={(e) => { inviteResponse(e, channel, false); }} title="Decline invite"><img className="addRemoveButtonImg" src="/assets/img/minus.png" alt="Decline" /></button></div>
                    </div>
                </div>
            );
        }
    });

    return(
        <div id="channelInvitesContainer">
            <p id="pageTitle">Invites</p>
            { isInvites &&
                channels
            }
            { !isInvites &&
                <p id="emptyChannelInvites">It appears that you do not have any channel invites.</p>
            }
        </div>
    );
}

//load all of the users channels from the server
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

const createChangePasswordWindow = (e) => {
    e.preventDefault();
    ReactDOM.render(
        <ChangePassword csrf={document.querySelector("#hiddenCSRF").innerHTML} />, 
        document.querySelector("#content")
    );
    return false;
};

function updateScroll(){
    let messagesDiv = document.querySelector("#messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

const setup = function(csrf){
    createNavBar(csrf);

    document.querySelector("#hiddenCSRF").innerHTML = csrf;

    createChannelListWindow(csrf);

    loadChannelsFromServer(csrf);

    connection.onmessage = (message) => {
        const messages = document.querySelector('#messages');
        let json = JSON.parse(message.data);

        if(json.action === "SEND_MESSAGE"){
            if(json.username && json.content && json.createdDate) {
                /*
                let emptyChannelP = document.querySelectorAll('.emptyChannelP');
                console.dir(emptyChannelP);
                for(let i = 0; i < emptyChannelP.length; i++){
                    console.dir("deleting empty p");
                    emptyChannelP[i].parentNode.removeChild(emptyChannelP[i]);
                }
                */
                const p = document.createElement('p');
                p.className = "addedWSMessage";
                // console.dir(json.createdDate);
                const date = new Date(parseInt(json.createdDate));
                p.textContent = `${date.toLocaleDateString()} - ${date.toLocaleTimeString()} | ${json.username}: ${json.content}`;
                messages.appendChild(p);
                updateScroll();
            }
        }
        else if(json.action === 'CHANNEL_DELETED'){
            if(json.channelID === currentChannel){
                redirect({redirect:'/dashboard'});
            }
            else{
                loadChannelsFromServer(document.querySelector("#hiddenCSRF").innerHTML);
            }
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