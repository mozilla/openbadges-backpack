var remote = require('../remote')
  , configuration = require('../lib/configuration')

console.log('loaded');

exports.test_badge = function(req, res) {
  var protocol = configuration.get('protocol') || 'http';
  var port = configuration.get('external_port') || '';
  setTimeout(function(){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      recipient: 'me@example.com',
      evidence: '/test/evidence',
      expires: '2040-08-13',
      issued_on: '2011-08-23',
      badge: {
        version: 'v0.5.0',
        name: 'Open Source Contributor',
        description: 'For rocking in the free world',
        image: '/images/test-badge.png',
        criteria: '/test/criteria',
        issuer: {
          name: 'Open Badges',
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