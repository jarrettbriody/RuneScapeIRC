const http = require('http');
const WsServer = require('websocket').server;
const url = require('url');
const query = require('querystring');
const handler = require('./handler.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const clients = [];
const messages = [];

const urlStruct = {
  '/': handler.getIndex,
  '/style.css': handler.getCSS,
  '/bundle.js': handler.getBundle,
  notFound: handler.notFound,
};

const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);
  const params = query.parse(parsedUrl.query);
  if (urlStruct[parsedUrl.pathname]) {
    if (request.method === 'GET' || request.method === 'HEAD') {
      urlStruct[parsedUrl.pathname](request, response, params);
    }
  } else {
    urlStruct.notFound(request, response, params);
  }
};

const httpServer = http.createServer(onRequest).listen(port);

console.dir(`Listening on port: ${port}`);

const websocketServer = new WsServer({ httpServer });

websocketServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);
  clients.push(connection);
  const currentClientIndex = clients.length - 1;
  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      const messageJson = JSON.parse(message.utf8Data);
      messageJson.time = new Date();
      messages.push(messageJson);
      for (let i = 0; i < clients.length; i++) {
        clients[i].sendUTF(JSON.stringify(messageJson));
      }
    }
  });
  connection.on('close', () => {
    clients.splice(currentClientIndex, 1);
  });
});
