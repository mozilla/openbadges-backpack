var _ = require('underscore');

function makeValidBadge() {
  return {
    recipient: 'bimmy@example.com',
    evidence: '/bimmy-badge.json',
    expires: '2040-08-13',
    issued_on: '2011-08-23',
    badge: {
      version: 'v0.5.0',
      name: 'Open Source Contributor',
      description: 'For rocking in the free world',
      image: '/badge.png',
      criteria: 'http://example.com/criteria.html',
      issuer: {
        origin: 'http://p2pu.org',
        name: 'p2pu',
        org: 'school of webcraft',
        contact: 'admin@p2pu.org'
      }
    }
  };
}

function genstring(length) {
  var alphanum = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
  var str = [];
  var ind = 0;
  for (var i = 0; i < length; i += 1) {
    ind = Math.floor(Math.random() * (alphanum.length - 1));
    str.push(alphanum[ind]);
  }
  return str.join('');
}

function fixture(changes) {
  var assertion = makeValidBadge();
  Object.keys(changes || {}).forEach(function (k) {
    var fields = k.split('.');
    var current = assertion;
    var previous = null;
    
    fields.forEach(function (f) {
      previous = current;
      current = current[f];
    });
    
    previous[fields.pop()] = changes[k];
  });
  return assertion;
}

exports.fixture = fixture;
exports.genstring = genstring;