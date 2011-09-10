var remote = require('../remote')
  , configuration = require('../lib/configuration')
exports.issuer = function(req, res) {
  res.render('issuer', {
    login: false,
    title: 'Test Issuer'
  });
}

exports.test_badge = function(req, res) {
  var protocol = configuration.get('protocol') || 'http'
    , port = configuration.get('external_port') || ''
  
  var title = req.query.title || 'Open Source Contributor'
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
          origin: protocol + '://' + configuration.get('hostname') + (port? ':' + port : '')
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