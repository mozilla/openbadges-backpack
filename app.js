var express = require('express')
  , request = require('request')
  , ejs = require('ejs')
  , qs = require('querystring')
  , logger = require('./lib/logging')
  , secrets = require('./lib/secrets')
  , configuration = require('./lib/configuration')
  , sessions = require('connect-cookie-session')
  , path = require('path')
  , controller = require('./controller')

var app = express.createServer();
const COOKIE_SECRET = secrets.hydrateSecret('browserid_cookie', configuration.get('var_path'));
const COOKIE_KEY = 'openbadges_state';

// misc settings
app.set('view engine', 'ejs');
logger.enableConsoleLogging()
logger = logger.logger

// middleware
app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.static(path.join(__dirname, "static")));
  app.use(sessions({
    secret: COOKIE_SECRET,
    key: COOKIE_KEY,
    cookie: {
      httpOnly: true,
      maxAge: (7 * 24 * 60 * 60 * 1000), //one week
      secure: false
    }
  }));
  app.use(express.logger({
    format: 'dev',
    stream: {
      write: function(x) {
        logger.info(typeof x === 'string' ? x.trim() : x);
      }
    }
  }));
})

// check if logged in, render login page if not.
app.get('/',         controller.authRequired(controller.manage))
app.post('/sign-in', controller.authenticate)

app.listen(80);
logger.info('READY PLAYER ONE');
