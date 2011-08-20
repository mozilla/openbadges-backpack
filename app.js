var express = require('express'),
    logger = require('winston'),
    ejs = require('ejs'),
    https = require('https'),
    querystring = require('querystring');

// setup logging
// logger.add(logger.transports.File, { filename: 'development.log' });

var app = express.createServer();
app.set('view engine', 'ejs');

// middleware
app.use(express.bodyParser());

// check if logged in, render login page if not.
app.get('/', function(req, res) {
  res.render('index');
})

// sign in with browser id
app.post('/sign-in', function(req, res) {
  // throw out 403 if we can't find assertion
  if (!req.body['assertion']) {
    res.status(403)
    res.send('forbidden');
    return;
  }
  var params = querystring.stringify({
    assertion: req.body['assertion'],
    audience: 'hub.local'
  });
  var options = {
    host: 'browserid.org',
    port: '443',
    path: '/verify',
    method: 'POST',
    headers: {
      'Content-Length': params.length
    }
  };
  
  var verifier = https.request(options, function(res) {
    var body = '';
    logger.info('SENDING: ' + params);
    logger.info('STATUS: ' + res.statusCode);
    logger.info('HEADERS: ' + JSON.stringify(res.headers));
    res.on('data', function(chunk){ body += chunk; })
    res.on('end', function(){
      logger.info('BODY: ' + body);
      console.dir(res);
    })
  });
  verifier.on('error', function(e) {
    logger.warn('problem with assertion verification request:' + e.message);
  });
  verifier.end(params);
  res.send('yeaaaaaa');
})

app.listen(80);
logger.info('READY PLAYER ONE');
