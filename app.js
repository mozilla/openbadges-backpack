var express = require('express')
  , ejs = require('ejs')
  , logger = require('./lib/logging').logger
  , path = require('path')
  , controller = require('./controller')
  , middleware = require('./middleware')

var app = express.createServer();

// misc settings
app.set('view engine', 'ejs');

// middleware
app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.static(path.join(__dirname, "static")));
  app.use(middleware.cookieSessions());
  app.use(middleware.logRequests());
})

// routing
app.get('/',         controller.authRequired(controller.manage))
app.post('/sign-in', controller.authenticate)

app.listen(80);
logger.info('READY PLAYER ONE');
