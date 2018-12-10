"use strict";

var currentChannel = "";

var connection = new WebSocket('wss://runescapeirc.herokuapp.com');
//let connection = new WebSocket('ws://127.0.0.1:3000');

// stolen from https://www.quirksmode.org/js/cookies.html ---------------------------------------------------
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
//-----------------------------------------------------------------------------------------------------------

//ajax function for creating a new channel
var handleCreateChannel = function handleCreateChannel(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    // $("#errorContainer").animate({width:'hide'},350);
    if ($("#channelName").val() == '') {
        handleError("Channel name is required.");
        return false;
    }
    document.querySelector("#newChannelForm").action = e.target.action;
    sendAjax('POST', $("#newChannelForm").attr("action"), $("#newChannelForm").serialize(), function () {
        onManageChannelClick();
    });
    return false;
};

//ajax function for getting the cost of a runescape item
var getRSItem = function getRSItem(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    // $("#errorContainer").animate({width:'hide'},350);
    if ($("#itemNameField").val() == '') {
        handleError("Item name is required.");
        return false;
    }
    // console.dir($("#itemForm").serialize());
    sendAjax('POST', $("#itemForm").attr("action"), $("#itemForm").serialize(), function (json) {
        if (json.item) {
            document.querySelector("#item").innerHTML = "";
            var newImage = document.createElement("img");
            newImage.src = json.item.icon;
            document.querySelector("#item").appendChild(newImage);
            var newP = document.createElement("p");
            newP.innerHTML = json.item.current.price;
            document.querySelector("#item").appendChild(newP);
        }
    });
    return false;
};

//check to see if the passwords entered are valid
var handleChangePassword = function handleChangePassword(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    // $("#errorContainer").animate({width:'hide'},350);
    if ($("#oldPass").val() == '' || $("#pass").val() == '' || $("#pass2").val() == '') {
        handleError("All fields are required.");
        return false;
    }
    if ($("#pass").val() != $("#pass2").val()) {
        handleError("Passwords do not match.");
        return false;
    }
    sendAjax('POST', $("#changePasswordForm").attr("action"), $("#changePasswordForm").serialize(), function () {
        onProfileClick();
    });
    return false;
};

//ajax function for swapping channels when clicked
var onChannelClick = function onChannelClick(e, channel) {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    var addedWSMessages = document.querySelectorAll('.addedWSMessage');
    for (var i = 0; i < addedWSMessages.length; i++) {
        console.dir("removing ws message");
        addedWSMessages[i].parentNode.removeChild(addedWSMessages[i]);
    }
    connection.send(JSON.stringify({ action: "CHANGE_CHANNEL", channelID: channel._id }));
    sendAjax('POST', '/getSingleChannel', "channelID=" + channel._id + "&_csrf=" + document.querySelector('#hiddenCSRF').innerHTML, function (data) {
        currentChannel = channel._id;
        ReactDOM.render(React.createElement(Channel, { channel: data.channel[0] }), document.querySelector("#channelSection"));
    });
    return false;
};

//ajax function for getting the list of channels to be edited
var onManageChannelClick = function onManageChannelClick(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    if (e) {
        e.preventDefault();
    }
    sendAjax('GET', '/getChannels', null, function (data) {
        ReactDOM.render(React.createElement(EditChannelList, { channels: data.channels, csrf: document.querySelector('#hiddenCSRF').innerHTML }), document.querySelector("#content"));
    });
    return false;
};

//ajax function for getting unaccepted channel invites
var onChannelInvitesClick = function onChannelInvitesClick(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    if (e) {
        e.preventDefault();
    }
    sendAjax('GET', '/getChannels', null, function (data) {
        ReactDOM.render(React.createElement(ChannelInvites, { channels: data.channels, csrf: document.querySelector("#hiddenCSRF").innerHTML }), document.querySelector("#content"));
    });
    return false;
};

//react function for setting up profile page
var onProfileClick = function onProfileClick(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    if (e) e.preventDefault();
    ReactDOM.render(React.createElement(Profile, null), document.querySelector("#content"));
    return false;
};

//react function for setting up runescape tools page
var onRuneScapeToolsClick = function onRuneScapeToolsClick(e) {
    document.querySelector('#errorContainer').style.display = 'none';
    if (e) e.preventDefault();
    ReactDOM.render(React.createElement(RuneScapeTools, null), document.querySelector("#content"));
    return false;
};

//ajax function for deleting a channel
var onChannelRemove = function onChannelRemove(e, channel) {
    document.querySelector('#errorContainer').style.display = 'none';
    sendAjax('POST', '/removeChannel', "channelID=" + channel._id + "&_csrf=" + document.querySelector('#hiddenCSRF').innerHTML, function (data) {
        onManageChannelClick();
    });
};

//ajax function for responding to an invite
var inviteResponse = function inviteResponse(e, channel, accept) {
    document.querySelector('#errorContainer').style.display = 'none';
    sendAjax('POST', '/inviteResponse', "channelID=" + channel._id + "&accepted=" + accept + "&_csrf=" + document.querySelector('#hiddenCSRF').innerHTML, function (data) {
        onChannelInvitesClick();
    });
};

//ajax function for leaving an unowned channel
var onChannelLeave = function onChannelLeave(e, channel) {
    document.querySelector('#errorContainer').style.display = 'none';
    sendAjax('POST', '/leaveChannel', "channelID=" + channel._id + "&_csrf=" + document.querySelector('#hiddenCSRF').innerHTML, function (data) {
        onManageChannelClick();
    });
};

//ajax function for sending a channel invite
var onSendInvite = function onSendInvite(e, channel, username) {
    document.querySelector('#errorContainer').style.display = 'none';
    e.preventDefault();
    sendAjax('POST', '/inviteUser', "channelID=" + channel._id + "&username=" + username + "&_csrf=" + document.querySelector('#hiddenCSRF').innerHTML, function (data) {
        onManageChannelClick();
    });
    return false;
};

//send a websocket message based on this clients connection and some content
var handleSendMessage = function handleSendMessage(e) {
    var user = readCookie('username');
    var content = {
        action: "SEND_MESSAGE",
        username: user,
        content: document.querySelector("#messageInput").value,
        createdDate: Date.now(),
        channelID: currentChannel
    };
    var stringToSend = JSON.stringify(content);
    connection.send(stringToSend);
    if (e) e.preventDefault();
    return false;
};

//react content for navbar
var NavBar = function NavBar(props) {
    return React.createElement(
        "div",
        { id: "navBar" },
        React.createElement(
            "div",
            { id: "titleContainer" },
            React.createElement(
                "h1",
                { className: "appTitle" },
                "RuneScape IRC"
            )
        ),
        React.createElement(
            "div",
            { className: "navlink" },
            React.createElement(
                "a",
                { href: "/login", title: "Home" },
                React.createElement("i", { className: "fas fa-home" })
            )
        ),
        React.createElement(
            "div",
            { className: "navlink" },
            React.createElement(
                "a",
                { href: "/logout", title: "Log out" },
                React.createElement(
                    "span",
                    { className: "navlinkText" },
                    "Log out "
                ),
                React.createElement("i", { className: "fas fa-sign-out-alt" })
            )
        ),
        React.createElement(
            "div",
            { className: "navlink", id: "profileLink" },
            React.createElement(
                "a",
                { href: "#", title: "Your profile", onClick: function onClick(e) {
                        onProfileClick(e);
                    } },
                React.createElement(
                    "span",
                    { className: "navlinkText" },
                    "Profile "
                ),
                React.createElement("i", { className: "fas fa-user-circle" })
            )
        ),
        React.createElement(
            "div",
            { className: "navlink", id: "toolLink" },
            React.createElement(
                "a",
                { href: "#", title: "RuneScape Tools", onClick: function onClick(e) {
                        onRuneScapeToolsClick(e);
                    } },
                React.createElement(
                    "span",
                    { className: "navlinkText" },
                    "RuneScape Tools"
                )
            )
        )
    );
};

//create the channel react portion for sending messages and seeing them
var Channel = function Channel(props) {
    var channelMessages = props.channel.messages.map(function (message) {
        // console.dir(message.createdDate);
        var date = new Date(parseInt(message.createdDate));
        return React.createElement(
            "div",
            { className: "message" },
            React.createElement(
                "p",
                null,
                date.toLocaleDateString() + " - " + date.toLocaleTimeString() + " | " + message.username + ": " + message.content
            )
        );
    });

    return React.createElement(
        "div",
        { id: "channel" },
        React.createElement(
            "div",
            { id: "channelTitleContainer" },
            React.createElement(
                "h2",
                { id: "channelTitle" },
                props.channel.name
            )
        ),
        React.createElement(
            "div",
            { id: "messages" },
            props.channel.messages.length > 0 && channelMessages,
            props.channel.messages.length === 0 && React.createElement(
                "p",
                { className: "emptyChannelP" },
                "It's quiet in here... Why don't you start chatting by sending a message below?"
            )
        ),
        React.createElement(
            "form",
            { id: "sendMessageForm", name: "sendMessageForm",
                onSubmit: handleSendMessage,
                className: "channelForm"
            },
            React.createElement(
                "label",
                { "for": "message", className: "inputLabels" },
                "Message:  "
            ),
            React.createElement("input", { id: "messageInput", type: "text", name: "message", placeholder: "message" }),
            React.createElement(
                "button",
                { type: "submit", className: "formSubmit" },
                "Send"
            )
        )
    );
};

//generate the password change form
var ChangePassword = function ChangePassword(props) {
    return React.createElement(
        "div",
        { id: "accountFormContainer" },
        React.createElement(
            "form",
            { id: "changePasswordForm", name: "changePasswordForm",
                onSubmit: function onSubmit(e) {
                    handleChangePassword(e);
                },
                action: "/changePassword",
                method: "POST",
                className: "mainForm"
            },
            React.createElement(
                "h1",
                { className: "appTitle" },
                "RuneScape IRC"
            ),
            React.createElement(
                "h3",
                { className: "signInTitle" },
                "Change Password"
            ),
            React.createElement("hr", null),
            React.createElement(
                "div",
                { id: "changePasswordFormInput" },
                React.createElement(
                    "div",
                    { id: "oldPassContainer" },
                    React.createElement(
                        "h5",
                        null,
                        "Current Password:"
                    ),
                    React.createElement("input", { id: "oldPass", type: "password", name: "oldPass", placeholder: "password" })
                ),
                React.createElement(
                    "div",
                    { id: "newPassContainer1" },
                    React.createElement(
                        "h5",
                        null,
                        "New Password:"
                    ),
                    React.createElement("input", { id: "pass", type: "password", name: "pass", placeholder: "password" })
                ),
                React.createElement(
                    "div",
                    { id: "newPassContainer2" },
                    React.createElement(
                        "h5",
                        null,
                        "Confirm New Password:"
                    ),
                    React.createElement("input", { id: "pass2", type: "password", name: "pass2", placeholder: "confirm password" })
                )
            ),
            React.createElement("input", { type: "hidden", name: "_csrf", value: props.csrf }),
            React.createElement("input", { id: "changePassButton", className: "formSubmit", type: "submit", value: "Change Password" })
        )
    );
};

//profile react page
var Profile = function Profile() {
    return React.createElement(
        "div",
        { id: "profile" },
        React.createElement(
            "div",
            { id: "profileLinksContainer" },
            React.createElement(
                "div",
                { className: "navlink" },
                React.createElement(
                    "a",
                    { href: "#", onClick: function onClick(e) {
                            onManageChannelClick(e);
                        } },
                    "Manage Channels"
                )
            ),
            React.createElement(
                "div",
                { className: "navlink" },
                React.createElement(
                    "a",
                    { href: "#", onClick: function onClick(e) {
                            onChannelInvitesClick(e);
                        } },
                    "Channel Invites"
                )
            ),
            React.createElement(
                "div",
                { className: "navlink" },
                React.createElement(
                    "a",
                    { href: "#", onClick: function onClick(e) {
                            createChangePasswordWindow(e);
                        } },
                    "Change Password"
                )
            )
        ),
        React.createElement(
            "div",
            { id: "profileRow1" },
            React.createElement(
                "div",
                { id: "profileImgContainer" },
                React.createElement("img", { id: "profileImg", src: "/assets/img/profile.png", alt: "profile picture" })
            ),
            React.createElement(
                "div",
                { id: "profileUserDescContainer" },
                React.createElement(
                    "h2",
                    { id: "profileUsername" },
                    readCookie('username')
                ),
                React.createElement("hr", null),
                React.createElement(
                    "p",
                    { id: "profileDescription" },
                    "This is a placeholder description! Welcome to my profile, I'm a happy, go-lucky person who likes long walks on the beach and candle lit dinners!"
                )
            )
        )
    );
};

//runescape tools react page
var RuneScapeTools = function RuneScapeTools() {
    return React.createElement(
        "div",
        { id: "runeScapeTools" },
        React.createElement(
            "section",
            { id: "itemPriceSection" },
            React.createElement(
                "form",
                { id: "itemForm", onSubmit: function onSubmit(e) {
                        getRSItem(e);
                    }, action: "/getItem", method: "POST" },
                React.createElement(
                    "h3",
                    { className: "signInTitle" },
                    "Item Cost Checker"
                ),
                React.createElement("hr", null),
                React.createElement("input", { id: "itemNameField", type: "text", name: "itemName", placeholder: "Item Name" }),
                React.createElement("input", { id: "currentCSRF", type: "hidden", name: "_csrf", value: document.querySelector("#hiddenCSRF").innerHTML }),
                React.createElement("input", { type: "submit", value: "Get Item Price" })
            ),
            React.createElement(
                "div",
                { id: "itemContainer" },
                React.createElement("div", { id: "item" })
            )
        )
    );
};

//generate the list of all channels
var ChannelList = function ChannelList(props) {
    var isNotMember = true;
    for (var i = 0; i < props.channels.length; i++) {
        if (props.channels[i].accepted) {
            isNotMember = false;
            break;
        }
    }
    var channelLinks = props.channels.map(function (channel) {
        if (channel.accepted) {
            return React.createElement(
                "p",
                { key: channel._id, className: "channelLinkContainer" },
                React.createElement(
                    "a",
                    { className: "channelLink", href: "/getSingleChannel", onClick: function onClick(e) {
                            onChannelClick(e, channel);
                        } },
                    channel.name
                )
            );
        }
    });

    return React.createElement(
        "div",
        { id: "channelList" },
        React.createElement(
            "div",
            { id: "channelListTitleContainer" },
            React.createElement(
                "h2",
                { id: "channelListTitle" },
                "Channels"
            )
        ),
        !isNotMember && React.createElement(
            "div",
            { id: "channels" },
            channelLinks
        ),
        isNotMember && React.createElement(
            "div",
            { id: "channels" },
            React.createElement(
                "p",
                null,
                "It appears that you are not a member of any channels. Click the profile button in the top right to manage your channels."
            )
        )
    );
};

//react page for channels that are owned or that the user is apart of
var EditChannelList = function EditChannelList(props) {
    var isNotMember = true;
    for (var i = 0; i < props.channels.length; i++) {
        if (props.channels[i].accepted) {
            isNotMember = false;
            break;
        }
    }
    var channels = props.channels.map(function (channel) {
        if (channel.accepted) {
            return React.createElement(
                "div",
                { className: "editChannel" },
                React.createElement(
                    "div",
                    { id: "editChannelNameContainer" },
                    React.createElement(
                        "p",
                        null,
                        channel.name
                    )
                ),
                React.createElement("hr", null),
                React.createElement(
                    "div",
                    { id: "editChannelFormContainer" },
                    React.createElement(
                        "form",
                        { id: "addUserForm",
                            name: "addUserForm",
                            method: "POST",
                            action: "/inviteUser",
                            onSubmit: function onSubmit(e) {
                                onSendInvite(e, channel, e.target.parentNode.querySelector('#userInput').value);
                            },
                            className: "addUserForm"
                        },
                        React.createElement(
                            "label",
                            { "for": "username", className: "inputLabels" },
                            "Invite User:  "
                        ),
                        React.createElement("input", { id: "userInput", type: "text", name: "username", placeholder: "username" }),
                        React.createElement("input", { id: "currentCSRF", type: "hidden", name: "_csrf", value: document.querySelector("#hiddenCSRF").innerHTML }),
                        React.createElement("input", { id: "currentChannelID", type: "hidden", name: "channelID", value: channel._id }),
                        React.createElement(
                            "button",
                            { type: "submit", className: "formSubmit" },
                            "Send Invite"
                        )
                    )
                ),
                !channel.owner && React.createElement(
                    "div",
                    null,
                    React.createElement("hr", null),
                    React.createElement(
                        "div",
                        { id: "editChannelButtonContainer" },
                        React.createElement(
                            "button",
                            { className: "formSubmit", onClick: function onClick(e) {
                                    onChannelLeave(e, channel);
                                } },
                            "Leave Channel"
                        )
                    )
                ),
                channel.owner && React.createElement(
                    "div",
                    null,
                    React.createElement("hr", null),
                    React.createElement(
                        "div",
                        { id: "editChannelButtonContainer" },
                        React.createElement(
                            "button",
                            { className: "formSubmit", onClick: function onClick(e) {
                                    onChannelRemove(e, channel);
                                } },
                            "Delete Channel"
                        )
                    )
                )
            );
        }
    });

    return React.createElement(
        "div",
        { id: "editChannelsContainer" },
        React.createElement(
            "p",
            { id: "pageTitle" },
            "Your Channels"
        ),
        React.createElement(
            "form",
            { id: "newChannelForm", name: "newChannelForm",
                onSubmit: handleCreateChannel,
                action: "/createChannel",
                method: "POST",
                className: "channelForm"
            },
            React.createElement(
                "label",
                { "for": "name", className: "inputLabels" },
                "Channel Name:  "
            ),
            React.createElement("input", { id: "channelName", type: "text", name: "name", placeholder: "channel name" }),
            React.createElement("input", { id: "currentCSRF", type: "hidden", name: "_csrf", value: props.csrf }),
            React.createElement(
                "button",
                { type: "submit", className: "formSubmit" },
                "Create Channel"
            )
        ),
        React.createElement("hr", null),
        !isNotMember && channels,
        isNotMember && React.createElement(
            "p",
            { id: "emptyEditChannels" },
            "It appears that you are not a member of any channels. Create a new channel above to get started."
        )
    );
};

//react page for channel invites
var ChannelInvites = function ChannelInvites(props) {
    var isInvites = false;
    for (var i = 0; i < props.channels.length; i++) {
        if (!props.channels[i].accepted) {
            isInvites = true;
            break;
        }
    }
    var channels = props.channels.map(function (channel) {
        if (!channel.accepted) {
            return React.createElement(
                "div",
                { className: "channelInvite" },
                React.createElement(
                    "div",
                    { id: "channelInviteNameContainer" },
                    React.createElement(
                        "p",
                        null,
                        channel.name
                    )
                ),
                React.createElement(
                    "div",
                    { id: "invButtons" },
                    React.createElement(
                        "div",
                        { id: "acceptInviteButtonContainer" },
                        React.createElement(
                            "button",
                            { className: "formSubmit", onClick: function onClick(e) {
                                    inviteResponse(e, channel, true);
                                }, title: "Accept invite" },
                            React.createElement("img", { className: "addRemoveButtonImg", src: "/assets/img/plus.png", alt: "Accept" })
                        )
                    ),
                    React.createElement(
                        "div",
                        { id: "declineInviteButtonContainer" },
                        React.createElement(
                            "button",
                            { className: "formSubmit", onClick: function onClick(e) {
                                    inviteResponse(e, channel, false);
                                }, title: "Decline invite" },
                            React.createElement("img", { className: "addRemoveButtonImg", src: "/assets/img/minus.png", alt: "Decline" })
                        )
                    )
                )
            );
        }
    });

    return React.createElement(
        "div",
        { id: "channelInvitesContainer" },
        React.createElement(
            "p",
            { id: "pageTitle" },
            "Invites"
        ),
        isInvites && channels,
        !isInvites && React.createElement(
            "p",
            { id: "emptyChannelInvites" },
            "It appears that you do not have any channel invites."
        )
    );
};

//load all of the users channels from the server
var loadChannelsFromServer = function loadChannelsFromServer(csrf) {
    sendAjax('GET', '/getChannels', null, function (data) {
        ReactDOM.render(React.createElement(ChannelList, { channels: data.channels, csrf: csrf }), document.querySelector("#channelListSection"));
    });
};

var createChannelListWindow = function createChannelListWindow(csrf) {
    ReactDOM.render(React.createElement(ChannelList, { channels: [], csrf: csrf }), document.querySelector("#channelListSection"));
};

var createNavBar = function createNavBar(csrf) {
    ReactDOM.render(React.createElement(NavBar, { csrf: csrf }), document.querySelector("nav"));
};

var createChangePasswordWindow = function createChangePasswordWindow(e) {
    e.preventDefault();
    ReactDOM.render(React.createElement(ChangePassword, { csrf: document.querySelector("#hiddenCSRF").innerHTML }), document.querySelector("#content"));
    return false;
};

function updateScroll() {
    var messagesDiv = document.querySelector("#messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

var setup = function setup(csrf) {
    createNavBar(csrf);

    document.querySelector("#hiddenCSRF").innerHTML = csrf;

    createChannelListWindow(csrf);

    loadChannelsFromServer(csrf);

    connection.onmessage = function (message) {
        var messages = document.querySelector('#messages');
        var json = JSON.parse(message.data);

        if (json.action === "SEND_MESSAGE") {
            if (json.username && json.content && json.createdDate) {
                /*
                let emptyChannelP = document.querySelectorAll('.emptyChannelP');
                console.dir(emptyChannelP);
                for(let i = 0; i < emptyChannelP.length; i++){
                    console.dir("deleting empty p");
                    emptyChannelP[i].parentNode.removeChild(emptyChannelP[i]);
                }
                */
                var p = document.createElement('p');
                p.className = "addedWSMessage";
                // console.dir(json.createdDate);
                var date = new Date(parseInt(json.createdDate));
                p.textContent = date.toLocaleDateString() + " - " + date.toLocaleTimeString() + " | " + json.username + ": " + json.content;
                messages.appendChild(p);
                updateScroll();
            }
        } else if (json.action === 'CHANNEL_DELETED') {
            if (json.channelID === currentChannel) {
                redirect({ redirect: '/dashboard' });
            } else {
                createChannelListWindow(document.querySelector("#hiddenCSRF").innerHTML);
            }
        }
    };
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
