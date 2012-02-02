// Controller for providing metadata for & awarding demo badges.
var qs = require('querystring')
  , configuration = require('../lib/configuration')
  , request = require('request')

var protocol = configuration.get('protocol') || 'http'
  , port = configuration.get('external_port') || ''
  , ORIGIN = protocol + '://' + configuration.get('hostname') + (port? ':' + port : '');

// Render the view for the demo badge issuer.
exports.issuer = function(req, res) {
  res.render('issuer', {
    login: false,
    title: 'Demo Issuer',
    csrfToken: req.session._csrf
  });
}

// Bake & award a demo badge. Uses `demo_badge` below to generate a proper assertion.
exports.award = function(req, res) {
  var assertionURL = encodeURIComponent([ORIGIN + '/demo/badge.json', qs.stringify(req.body)].join('?'))
    , bakeURL = ORIGIN + '/baker?award=true&assertion=' + assertionURL;
  
  request({url: bakeURL, encoding:'binary'},  function(err, resp, body) {
    res.send(Buffer(body, 'binary'), {'content-type': 'image/png'});
  });

}

// Create a demo badge. Optionally override default values by providing GET
// params. This less an avenue for fraud than it might look: the name will
// always contain "DEMO" and the issuer will always be the backpack host.
exports.demo_badge = function(req, res) {
  var title = req.query.title || 'Demo Badge'
    , image = req.query.image || '/images/demo-badge.png'
    , desc = req.query.desc || 'For rocking in the free world'
    , recp = req.query.recp || 'me@example.com';

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    recipient: recp,
    evidence: '/demo/evidence',
    expires: '2040-08-13',
    issued_on: '2011-08-23',
    badge: {
      version: 'v0.5.0',
      name: 'DEMO: ' + title,
      description: desc,
      image: image,
      criteria: '/demo/criteria',
      issuer: {
        name: 'Open Badges Demo',
        origin: ORIGIN
      }
    }
  }));
}

// Send back a bad assertion after a timeout to simulate latency.
exports.bad_badge = function(req, res) {
  setTimeout(function(){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({'this': 'is not a badge'}));
  }, 200);
}