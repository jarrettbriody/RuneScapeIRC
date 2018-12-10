const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);
const url = require('url');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const dbURL = process.env.MONGODB_URI || 'mongodb://localhost/jab1089runescapeirc';

mongoose.connect(dbURL, (err) => {
  if (err) {
    console.log('Could not connect to the database.');
    throw err;
  }
});

let redisURL = {
  hostname: 'localhost',
  port: 6379,
};

let redisPASS;

if (process.env.REDISCLOUD_URL) {
  redisURL = url.parse(process.env.REDISCLOUD_URL);
  redisPASS = redisURL.auth.split(':')[1];
}

const redisClient = redis.createClient({ host: redisURL.hostname, port: redisURL.port });

redisClient.on('ready', () => {
  console.log('Connected to Redis.');
});

redisClient.on('error', () => {
  console.log('There was an error attempting to connect to Redis.');
});

if (process.env.REDISCLOUD_URL) {
  redisClient.auth(redisPASS, (err, reply) => {
    console.dir(err);
    console.log(reply);
  });
}

const router = require('./router.js');

const app = express();
require('express-ws')(app);
app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`)));
app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
app.enable('trust proxy');
app.disable('x-powered-by');
app.use(compression());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(session({
  key: 'sessionid',
  store: new RedisStore({
    host: redisURL.hostname,
    port: redisURL.port,
    pass: redisPASS,
  }),
  secret: 'Domo Arigato',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
}));
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);
app.use(cookieParser());

app.use(csrf());
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  console.log('Missing CSRF token');
  return false;
});

// rate limiter to limit spam requests
const apiLimiter = rateLimit({
  windowMs: 3 * 1000,
  max: 1,
  message: { error: 'You have exceeded the rate limit. Try again in 3 seconds.' },
});
app.use('/signup', apiLimiter);
app.use('/changePassword', apiLimiter);
app.use('/login', apiLimiter);

router(app);

app.use((req, res) => {
  res.status(404);
  return res.render('404');
});

app.listen(port, (err) => {
  if (err) throw err;
  console.log(`Listening on port ${port}`);
});
