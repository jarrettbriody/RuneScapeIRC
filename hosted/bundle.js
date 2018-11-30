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

var handleCreateChannel = function handleCreateChannel(e) {
    e.preventDefault();
    $("#errorContainer").animate({ width: 'hide' }, 350);
    if ($("#channelName").val() == '') {
        handleError("Channel name is required.");
        return false;
    }
    document.querySelector("#newChannelForm").action = e.target.action;
    sendAjax('POST', $("#newChannelForm").attr("action"), $("#newChannelForm").serialize(), function () {
        loadChannelsFromServer();
    });
    return false;
};

var onChannelClick = function onChannelClick(e, channel) {
    e.preventDefault();
    console.dir(document.cookie);
    sendAjax('POST', '/getSingleChannel', "channelID=" + channel._id + "&_csrf=" + document.querySelector('#hiddenCSRF').innerHTML, function (data) {
        currentChannel = channel._id;
        ReactDOM.render(React.createElement(Channel, { channel: data.channel[0] }), document.querySelector("#channelSection"));
    });
    return false;
};

//send a websocket message based on this clients connection and some content
var handleSendMessage = function handleSendMessage(e) {
    var user = readCookie('username');
    var content = {
        username: user,
        content: document.querySelector("#messageInput").value,
        createdDate: Date.now(),
        channelID: currentChannel
    };
    var stringToSend = JSON.stringify(content);
    console.dir(stringToSend);
    connection.send(stringToSend);
    if (e) e.preventDefault();
    return false;
};

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
            "a",
            { href: "/login" },
            React.createElement("img", { id: "logo", src: "/assets/img/logo.png", alt: "logo", title: "Home" })
        ),
        React.createElement(
            "div",
            { "class": "navlink" },
            React.createElement(
                "a",
                { href: "/logout" },
                "Log out"
            )
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
                "h5",
                { className: "inputLabels" },
                "Channel Name:"
            ),
            React.createElement("input", { id: "channelName", type: "text", name: "name", placeholder: "Task Name" }),
            React.createElement("input", { id: "currentCSRF", type: "hidden", name: "_csrf", value: props.csrf }),
            React.createElement(
                "button",
                { type: "submit", className: "formSubmit" },
                "Create Channel"
            )
        )
    );
};

//create a single task expanded menu
var Channel = function Channel(props) {
    var channelMessages = props.channel.messages.map(function (message) {
        return React.createElement(
            "div",
            { className: "message" },
            React.createElement(
                "p",
                null,
                message.createdDate + " | " + message.username + ": " + message.content
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
            channelMessages
        ),
        React.createElement(
            "form",
            { id: "sendMessageForm", name: "sendMessageForm",
                onSubmit: handleSendMessage,
                className: "channelForm"
            },
            React.createElement(
                "h5",
                { className: "inputLabels" },
                "Message:"
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

//generate the list of all user tasks
var ChannelList = function ChannelList(props) {
    console.dir(props.channels);
    var channelLinks = props.channels.map(function (channel) {
        return React.createElement(
            "div",
            { key: channel._id, className: "channelLinkContainer" },
            React.createElement(
                "a",
                { className: "channelLink", href: "/getSingleChannel", onClick: function onClick(e) {
                        onChannelClick(e, channel);
                    } },
                channel.name
            )
        );
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
        channelLinks
    );
};

//load all of the user tasks from the server
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

var setup = function setup(csrf) {
    createNavBar(csrf);

    document.querySelector("#hiddenCSRF").innerHTML = csrf;

    createChannelListWindow(csrf);

    loadChannelsFromServer(csrf);

    connection.onmessage = function (message) {
        var messages = document.querySelector('#messages');
        var json = JSON.parse(message.data);
        if (json.username && json.content && json.createdDate) {
            var p = document.createElement('p');
            p.textContent = json.time + " | " + json.user + ": " + json.message;
            messages.appendChild(p);
            //updateScroll();
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
  $('#errorMessage').text(message);
  $('#errorContainer').animate({ width: 'toggle' }, 350);
};

var redirect = function redirect(response) {
  $('#errorContainer').animate({ width: 'hide' }, 350);
  window.location = response.redirect;
};

var sendAjax = function sendAjax(type, action, data, success) {
  // console.dir(action + " " + data);
  $.ajax({
    cache: false,
    type: type,
    url: action,
    data: data,
    dataType: 'json',
    success: success,
    error: function error(xhr, status, _error) {
      var messageObj = JSON.parse(xhr.responseText);
      handleError(messageObj.error);
    }
  });
};
