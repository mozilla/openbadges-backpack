var http = require('http'),
    badge = require('./utils').fixture;

var PORT = 10000;
var HOST = '127.0.0.1';
var makeServer = function(code, body, type) {
  type = type || 'application/json';
  return function(){
    var server = http.createServer();
    server.on('request', function(req, res){
      res.statusCode = code;
      res.setHeader('content-type', type);
      res.end(body);
    });
    server.listen(++PORT, HOST);
    server.port = PORT;
    server.url = 'http://' + HOST + ':' + PORT + '/'
    return server;
  }
}

exports.goodAssertion = makeServer(200, JSON.stringify(badge()))
exports.badAssertion = makeServer(200, JSON.stringify(badge({recipient: null})));
exports.reallyBadAssertion = makeServer(200, '()dj;1{}this will fail json;())}');
exports.extraBadAssertion = makeServer(200, '<html><body><h1>EY YO</h1></body></html>', 'text/html');
exports.dreadfulAssertion = makeServer(500, 'totally messed up', 'text/plain');
