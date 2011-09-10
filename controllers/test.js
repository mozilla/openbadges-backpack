var qs = require('querystring')
  , configuration = require('../lib/configuration')
  , request = require('request')

var protocol = configuration.get('protocol') || 'http'
  , port = configuration.get('external_port') || ''
  , ORIGIN = protocol + '://' + configuration.get('hostname') + (port? ':' + port : '');

exports.issuer = function(req, res) {
  res.render('issuer', {
    login: false,
    title: 'Test Issuer'
  });
}
exports.award = function(req, res) {
  var assertionURL = encodeURIComponent([ORIGIN + '/test/badge.json', qs.stringify(req.body)].join('?'))
    , bakeURL = ORIGIN + '/baker?award=true&assertion=' + assertionURL;
  request({url: bakeURL, encoding:'binary'},  function(err, resp, body) {
    res.send(Buffer(body, 'binary'), {'content-type': 'image/png'});
  });
}

exports.test_badge = function(req, res) {
  var title = req.query.title || 'Test Badge'
    , image = req.query.image || '/images/test-badge.png'
    , desc = req.query.desc || 'For rocking in the free world'
    , recp = req.query.recp || 'me@example.com'
  
  setTimeout(function(){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      recipient: recp,
      evidence: '/test/evidence',
      expires: '2040-08-13',
      issued_on: '2011-08-23',
      badge: {
        version: 'v0.5.0',
        name: 'TEST: ' + title,
        description: desc,
        image: image,
        criteria: '/test/criteria',
        issuer: {
          name: 'Open Badges Test',
          origin: ORIGIN
        }
      }
    }));
  }, 200);
}

exports.bad_badge = function(req, res) {
  setTimeout(function(){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({'this': 'is not a badge'}));
  }, 200);
}