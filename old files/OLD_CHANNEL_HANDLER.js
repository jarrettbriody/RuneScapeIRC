const channels = {
  general: {
    name: 'general',
    clients: [],
    messages: [],
  },
  pking: {
    name: 'pking',
    clients: [],
    messages: [],
  },
  raids: {
    name: 'raids',
    clients: [],
    messages: [],
  },
};

// send user json containing array of channel names for them to generate clickable list of channels
const getChannelList = (request, response) => {
  if (request.method === 'GET') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    const jsonResponse = { channels: [] };
    const keys = Object.keys(channels);
    for (let i = 0; i < keys.length; i++) {
      jsonResponse.channels.push(channels[keys[i]].name);
    }
    response.write(JSON.stringify(jsonResponse));
  } else if (request.method === 'HEAD') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
  }
  response.end();
};

// remove requested channel if exists, throw error if not, dont allow deletion of general channel
const removeChannel = (request, response, body) => {
  if (request.method === 'POST') {
    if (body.channelName) {
      if (channels[body.channelName] && body.channelName !== 'general') {
        delete channels[body.channelName];
        response.writeHead(204);
      } else if (body.channelName === 'general') {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.write(JSON.stringify({ message: 'You cannot delete the general channel.', id: 'invalidChannelParams' }));
      } else {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.write(JSON.stringify({ message: 'Channel does not exist.', id: 'invalidChannelParams' }));
      }
    } else {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.write(JSON.stringify({ message: 'Channel name is required.', id: 'invalidChannelParams' }));
    }
    response.end();
  }
};

// create a channel, dont if it already exists
const createChannel = (request, response, body) => {
  if (request.method === 'POST') {
    if (body.channelName) {
      if (channels[body.channelName]) {
        response.writeHead(204);
      } else {
        channels[body.channelName] = { name: body.channelName, clients: [], messages: [] };
        response.writeHead(201, { 'Content-Type': 'application/json' });
        response.write(JSON.stringify({ message: 'Created successfully.' }));
      }
    } else {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.write(JSON.stringify({ message: 'Channel name is required.', id: 'invalidChannelParams' }));
    }
    response.end();
  }
};

module.exports.channels = channels;
module.exports.createChannel = createChannel;
module.exports.removeChannel = removeChannel;
module.exports.getChannelList = getChannelList;
