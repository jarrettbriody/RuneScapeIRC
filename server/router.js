const controllers = require('./controllers');
const mid = require('./middleware');
const request = require('request');

const itemLookup = {};

request('https://rsbuddy.com/exchange/summary.json', (error, response, body) => {
  if (!error && response.statusCode === 200) {
    const json = JSON.parse(body);
    const keys = Object.keys(json);
    for (let i = 0; i < keys.length; i++) {
      itemLookup[json[keys[i]].name.toLowerCase()] = json[keys[i]].id;
    }
  }
});

const router = (app) => {
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);
  app.get('/getChannels', mid.requiresLogin, controllers.Channel.getChannels);
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  app.post(
    '/changePassword',
    mid.requiresSecure,
    mid.requiresLogin,
    controllers.Account.changePassword
  );
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/dashboard', mid.requiresLogin, controllers.Channel.createChannelListPage);
  app.post('/getItem', mid.requiresLogin, (req, res) => {
    // console.dir(req.body);
    request(`http://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=${itemLookup[req.body.itemName]}`, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.status(200).send(body);
      } else {
        res.status(400).json({ error: 'Invalid item name.' });
      }
    });
  });
  app.post('/getSingleChannel', mid.requiresLogin, controllers.Channel.getSingleChannel);
  app.post('/createChannel', mid.requiresLogin, controllers.Channel.createChannel);
  app.post('/removeChannel', mid.requiresLogin, controllers.Channel.removeChannel);
  app.post('/leaveChannel', mid.requiresLogin, controllers.Channel.leaveChannel);
  app.post('/inviteUser', mid.requiresLogin, controllers.Channel.inviteUser);
  app.post('/inviteResponse', mid.requiresLogin, controllers.Channel.inviteResponse);
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.ws('/', (ws) => { // (ws, req)
    let currentChannel = '';
    ws.on('message', (msg) => {
      const msgJson = JSON.parse(msg);

      if (msgJson.action === 'SEND_MESSAGE') controllers.Channel.addChannelMessage(msgJson);

      else if (msgJson.action === 'CHANGE_CHANNEL') {
        controllers.Channel.swapConnectionChannel(currentChannel, msgJson.channelID, ws);
        currentChannel = msgJson.channelID;
      }
    });

    ws.on('close', () => {
      controllers.Channel.endConnection(currentChannel, ws);
      currentChannel = '';
    });
  });
};

module.exports = router;
