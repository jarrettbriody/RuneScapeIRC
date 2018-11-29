const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);
  app.get('/getTasks', mid.requiresLogin, controllers.Task.getTasks);
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
  app.get('/channels', mid.requiresLogin, controllers.Channel.createChannelsPage);
  app.post('/createChannel', mid.requiresLogin, controllers.Channel.createChannel);
  app.post('/removeChannel', mid.requiresLogin, controllers.Channel.removeChannel);
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
};

module.exports = router;
