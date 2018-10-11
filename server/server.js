const http = require('http');
const WsServer = require('websocket').server;
const url = require('url');
const query = require('querystring');
const resourceHandler = require('./resourceHandler.js');
const channelHandler = require('./channelHandler.js');
const runescapeHandler = require('./runescapeHandler.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const urlStruct = {
  '/': resourceHandler.getIndex,
  '/style.css': resourceHandler.getCSS,
  '/bundle.js': resourceHandler.getBundle,
  '/runescape_uf.ttf': resourceHandler.getFont,
  '/plus.png': resourceHandler.getPlus,
  '/minus.png': resourceHandler.getMinus,
  '/getChannelList': channelHandler.getChannelList,
  '/createChannel': channelHandler.createChannel,
  '/removeChannel': channelHandler.removeChannel,
  '/getItem': runescapeHandler.getRSItem,
  notFound: resourceHandler.notFound,
};

// onrequest called every time the server is communcated w/, passes req to respective methods
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);
  const params = query.parse(parsedUrl.query);
  if (urlStruct[parsedUrl.pathname]) {
    if (request.method === 'GET' || request.method === 'HEAD') {
      urlStruct[parsedUrl.pathname](request, response, params);
    } else if (request.method === 'POST') {
      const body = [];

      request.on('error', (err) => {
        console.dir(err);
        response.statusCode = 400;
        response.end();
      });

      request.on('data', (chunk) => {
        body.push(chunk);
      });

      request.on('end', () => {
        const bodyString = Buffer.concat(body).toString();
        const bodyParams = query.parse(bodyString);
        urlStruct[parsedUrl.pathname](request, response, bodyParams);
      });
    }
  } else {
    urlStruct.notFound(request, response, params);
  }
};

const httpServer = http.createServer(onRequest).listen(port);

console.dir(`Listening on port: ${port}`);

// setup the websocket serverside
const websocketServer = new WsServer({ httpServer });

// when a new client requests a websocket
websocketServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);
  channelHandler.channels.general.clients.push(connection);
  let currentChannel = 'general';
  // send the new user the general messages
  if (channelHandler.channels[currentChannel].messages.length > 0) {
    for (let i = 0; i < channelHandler.channels[currentChannel].messages.length; i++) {
      connection.sendUTF(JSON.stringify(channelHandler.channels[currentChannel].messages[i]));
    }
  }
  // when the user messages the server
  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      const messageJson = JSON.parse(message.utf8Data);
      // if the user is just sending a normal message to a channel or is switching channels
      if (messageJson.type === 'message') {
        if (channelHandler.channels[messageJson.channel]) {
          // add the message to the channel and send it to every connected client in the channel
          const date = new Date();
          messageJson.time = `${date.toLocaleDateString()} | ${date.toLocaleTimeString()}`;
          channelHandler.channels[messageJson.channel].messages.push(messageJson);
          for (let i = 0; i < channelHandler.channels[messageJson.channel].clients.length; i++) {
            const client = channelHandler.channels[messageJson.channel].clients[i];
            client.sendUTF(JSON.stringify(messageJson));
          }
        }
      } else if (messageJson.type === 'changeChannel') {
        // swap clients channel
        if (channelHandler.channels[currentChannel]) {
          const clientIndex = channelHandler.channels[currentChannel].clients.indexOf(connection);
          channelHandler.channels[currentChannel].clients.splice(clientIndex, 1);
        }
        if (channelHandler.channels[messageJson.channel]) {
          channelHandler.channels[messageJson.channel].clients.push(connection);
          currentChannel = messageJson.channel;
          // send the client the messages in the channel they switched into
          for (let i = 0; i < channelHandler.channels[currentChannel].messages.length; i++) {
            connection.sendUTF(JSON.stringify(channelHandler.channels[currentChannel].messages[i]));
          }
        }
      }
    }
  });
  connection.on('close', () => {
    // remove client from the channel they are in
    if (channelHandler.channels[currentChannel]) {
      const clientIndex = channelHandler.channels[currentChannel].clients.indexOf(connection);
      channelHandler.channels[currentChannel].clients.splice(clientIndex, 1);
    }
  });
});
