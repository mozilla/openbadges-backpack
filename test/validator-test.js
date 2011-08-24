var vows = require('vows')
  , assert = require('assert')
  , validate = require('../validator').validate

var fixture = function(changes){
  changes = changes || {}
  var f = {
    recipient: 'bimmy@example.com',
    evidence: '/bimmy-badge.json',
    expires: '2040-08-13',
    issued_at: '2011-08-23',
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
  }
  function make_change(_base, _changes) {
    Object.keys(_changes).forEach(function(k){
      if (typeof _changes[k] === 'object') {
        make_change(_base[k], _changes[k]);
      } else {
        _base[k] = _changes[k];
      }
    })
  }
  make_change(f, changes);
  return f;
};



vows.describe('Badge Validator').addBatch({
  'When validating anything': {
    topic: function() { return validate({}); },
    'we get a structure': {
      'with a `status` member': function(topic) {
        assert.include(topic, 'status')
      },
      'with a `errors` member': function(topic) {
        assert.include(topic, 'error')
      }
    }
  },
  'When validating something invalid': {
    topic: function() { return validate({}); },
    'we get a bad status and errors': function(topic) {
      assert.equal(topic.status, 'failure');
      assert.ok(Object.keys(topic.error).length > 0);
    }
  },
  'Invalid assertions': {
    'with bad assertion.recipient': {
      topic: [
        fixture({recipient: 'lkajd'}),
        fixture({recipient: 'alskj@asdk'}),
        fixture({recipient: '@.com'}),
        fixture({recipient: '909090'}),
        fixture({recipient: '____!@'})
      ],
      'should fail with `email` errors': function(topic){
        topic.forEach(function(invalid){
          var result = validate(invalid);
          assert.include(result.error, 'assertion.recipient');
          assert.equal(result.error['assertion.recipient'], 'email');
        })
      }
    },
    'with bad assertion.evidence': {
      topic: [
        fixture({evidence: '-not-asdo'}),
        fixture({evidence: 'ftp://bad-scheme'}),
        fixture({evidence: '@.com:90/'})
      ],
      'should fail with `url` errors': function(topic){
        topic.forEach(function(invalid){
          var result = validate(invalid);
          assert.include(result.error, 'assertion.evidence');
          assert.equal(result.error['assertion.evidence'], 'url');
        })
      }
    },
    'with bad assertion.expires': {
      topic: [
        fixture({expires: 'oiajsd09gjas;oj09'}),
        fixture({expires: 'foreever ago'}),
        fixture({expires: '111111'}),
        fixture({expires: '1314145531'}),
        fixture({expires: '@.com:90/'})
      ],
      'should fail with `isodate` errors': function(topic){
        topic.forEach(function(invalid){
          var result = validate(invalid);
          assert.include(result.error, 'assertion.expires');
          assert.equal(result.error['assertion.expires'], 'isodate');
        })
      }
    },
    'with bad assertion.issued_at': {
      topic: [
        fixture({issued_at: 'oiajsd09gjas;oj09'}),
        fixture({issued_at: 'foreever ago'}),
        fixture({issued_at: '111111'}),
        fixture({issued_at: '1314145531'}),
        fixture({issued_at: '@.com:90/'})
      ],
      'should fail with `isodate` errors': function(topic){
        topic.forEach(function(invalid){
          var result = validate(invalid);
          assert.include(result.error, 'assertion.issued_at');
          assert.equal(result.error['assertion.issued_at'], 'isodate');
        })
      }
    },
    'with bad badge.version': {
      topic: [
        fixture({badge: {version: 'v100'}}),
        fixture({badge: {version: '50'}}),
        fixture({badge: {version: 'v10.1alpha'}})
      ],
      'should fail with `regex` errors': function(topic){
        topic.forEach(function(invalid){
          var result = validate(invalid);
          assert.include(result.error, 'badge.version');
          assert.equal(result.error['badge.version'], 'regex');
        })
      }
    },
    'with bad badge.name': {
    },
    'with bad badge.description': {
    },
    'with bad badge.image': {
    },
    'with bad badge.criteria': {
    },
    'with bad issuer.name': {
    },
    'with bad issuer.org': {
    },
    'with bad issuer.contact': {
    },
    'with bad issuer.url': {
    },
  }
}).export(module);

console.dir(validate(fixture({version: 'v100'})));
console.dir(validate(fixture({version: '50'})));
console.dir(validate(fixture({version: 'v10.1alpha'})));
