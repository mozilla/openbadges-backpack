var VALID_BADGE = function(){ return {
  recipient: 'bimmy@example.com',
  evidence: '/bimmy-badge.json',
  expires: '2040-08-13',
  issued_on: '2011-08-23',
  badge: {
    version: 'v0.5.0',
    name: 'HTML5',
    description: 'For rocking in the free world',
    image: '/html5.png',
    criteria: 'http://example.com/criteria.html',
    issuer: {
      name: 'p2pu',
      org: 'school of webcraft',
      contact: 'admin@p2pu.org',
      url: 'http://p2pu.org/schools/sow'
    }
  }
}}

var genstring = function(length) {
  var alphanum = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      str = [],
      ind = 0;
  for (var i = 0; i < length; i += 1) {
    ind = Math.floor(Math.random() * (alphanum.length - 1))
    str.push(alphanum[ind]);
  }
  return str.join('');
}

var fixture = function(changes){
  changes = changes || {}
  var _fixture = VALID_BADGE();
  function makeChange(_base, _changes) {
    Object.keys(_changes).forEach(function(k){
      if (typeof _changes[k] === 'object' && _changes[k]) {
        makeChange(_base[k], _changes[k]);
      } else {
        _base[k] = _changes[k];
      }
    })
  }
  makeChange(_fixture, changes);
  return _fixture;
};

exports.fixture = fixture;
exports.genstring = genstring;