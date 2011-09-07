var express = require('express')
  , http = require('http')
  , path = require('path')
  , badge = require('../utils').fixture

var app = express.createServer();
var PORT = 10010;
var HOST = '127.0.0.1';

// simple server
var makeServer = function(code, body, type) {
  type = type || 'application/json';
  return function(){
    var server = http.createServer();
    server.on('request', function(req, res){
      res.statusCode = code;
      res.setHeader('conTENt-type', type);
      res.setHeader('content-length', body.length);
      if (req.method !== 'HEAD') res.write(body);
      res.end();
    });
    server.listen(++PORT, HOST);
    server.port = PORT;
    server.url = 'http://' + HOST + ':' + PORT + '/'
    return server;
  }
}

app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, "static")));
app.get('/good.json', function(req, res){
  res.send(badge());
});

exports.complex = function() {
  var obj = {}, port = ++PORT;
  app.listen(port);
  obj.url = function(path){ return 'http://' + HOST + ':' + port + '/' + path }
  return obj;
}
exports.simple = {
  good: makeServer(200, JSON.stringify(badge())),
  bad: makeServer(200, JSON.stringify(badge({recipient: null}))),
  invalidType: makeServer(200, JSON.stringify(badge()), 'text/html'),
  reallyBad: makeServer(200, '()dj;1{}this will fail json;())}'),
  extraBad: makeServer(200, '<html><body><h1>EY YO</h1></body></html>', 'text/html'),
  dreadful: makeServer(500, 'totally messed up', 'text/plain')
}

if (!module.parent) {
  console.log('listening on ' + PORT); app.listen(PORT);
}

