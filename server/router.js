const controllers = require('./controllers');
const mid = require('./middleware');

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
  app.post('/getSingleChannel', mid.requiresLogin, controllers.Channel.getSingleChannel);
  app.post('/createChannel', mid.requiresLogin, controllers.Channel.createChannel);
  app.post('/removeChannel', mid.requiresLogin, controllers.Channel.removeChannel);
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.ws('/', (ws) => { // (ws, req)
    ws.on('message', (msg) => {
      controllers.Channel.addChannelMessage(JSON.parse(msg));
    });
  });
};

module.exports = router;
