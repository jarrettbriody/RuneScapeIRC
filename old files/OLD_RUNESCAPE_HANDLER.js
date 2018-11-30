const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

const itemLookup = {};

// request the list if runescape items with their information from an external api
const requestRSBuddy = () => {
  const options = {
    protocol: 'https:',
    hostname: 'rsbuddy.com',
    path: '/exchange/summary.json',
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  };

  // send the request, call the callback
  const rsBuddyRequest = https.request(options, (rsBuddyResponse) => {
    rsBuddyResponse.setEncoding('utf8');
    const chunks = [];
    rsBuddyResponse.on('data', (chunk) => {
      chunks.push(chunk);
    });
    rsBuddyResponse.on('end', () => {
      // generate my own lookup table based on how i need
      const fullString = chunks.join('');
      const json = JSON.parse(fullString);
      const keys = Object.keys(json);
      for (let i = 0; i < keys.length; i++) {
        itemLookup[json[keys[i]].name.toLowerCase()] = json[keys[i]].id;
      }
    });
  });
  rsBuddyRequest.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  rsBuddyRequest.end();
};
requestRSBuddy();

// request the data about a rs item from the official rs api, use data from lookup table
const requestRSItem = (id, callback) => {
  const options = {
    protocol: 'http:',
    hostname: 'services.runescape.com',
    path: `/m=itemdb_oldschool/api/catalogue/detail.json?item=${id}`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  };

  // send the request, call the callback
  const rsItemRequest = http.request(options, (rsItemResponse) => {
    rsItemResponse.setEncoding('utf8');
    const chunks = [];
    rsItemResponse.on('data', (chunk) => {
      chunks.push(chunk);
    });
    rsItemResponse.on('end', () => {
      const fullString = chunks.join('');
      const json = JSON.parse(fullString);
      if (callback) {
        callback(json);
      }
    });
  });
  rsItemRequest.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
    return null;
  });

  rsItemRequest.end();
};

// accessed by user to pass in rs item and get sent back current data about it
const getRSItem = (request, response) => {
  if (request.method === 'GET') {
    const parsedUrl = url.parse(request.url);
    const params = querystring.parse(parsedUrl.query);
    if (itemLookup[params.itemName]) {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      requestRSItem(itemLookup[params.itemName], (json) => {
        response.write(JSON.stringify(json));
        response.end();
      });
    } else {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.write(JSON.stringify({ message: 'Invalid item name.', id: 'invalidItemParams' }));
      response.end();
    }
  } else if (request.method === 'HEAD') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end();
  }
};

module.exports.getRSItem = getRSItem;
