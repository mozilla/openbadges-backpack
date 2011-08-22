var express = require('express')
  , ejs = require('ejs')
  , logger = require('./lib/logging').logger
  , path = require('path')
  , middleware = require('./middleware')
  , controller = require('./controller')
  , helper = require('./helper')

var app = express.createServer();

// misc settings
app.set('view engine', 'ejs');

// middleware
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(path.join(__dirname, "static")));
app.use(middleware.cookieSessions());
app.use(middleware.logRequests());

// routing
(function (_) {
  app.post('/authenticate', controller.authenticate)
  app.get('/signout',       controller.signout)
  app.get('/login',         _.directTemplate('login'))
  app.get('/',              _.authRequired(controller.manage))
}(helper))

app.listen(80);
logger.info('READY PLAYER ONE');
