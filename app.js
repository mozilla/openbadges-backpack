// Configure & start express.

var express = require('express')
  , ejs = require('ejs')
  , path = require('path')
  , middleware = require('./middleware')
  , controller = require('./controller')
  , logger = require('./lib/logging').logger
;

// Create the app and set it up to use `ejs` templates which are easier to
// maintain than the default `jade` templates.
var app = express.createServer();
app.set('view engine', 'ejs');

// View helpers. `user` and `badges` are set so we can use them in `if`
// statements without getting undefined errors and without having to use typeof
// checks.
app.helpers({
  user: null,
  error: [],
  badges: {}
});

// Middleware. See `middleware.js` for more information on the custom
// middleware used.
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(path.join(__dirname, "static")));
app.use(middleware.cookieSessions());
app.use(middleware.logRequests());

// Routing for the application. See `controller.js` for more information.
app.post('/authenticate', controller.authenticate);
app.get('/signout',       controller.signout);
app.get('/login',         controller.login);
app.get('/',              controller.manage);

// FIXME: make port a configuration rather than hardcoded.
app.listen(80);
logger.info('READY PLAYER ONE');
