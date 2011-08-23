var model_factory = function(){
  var model = function(data){ this.data = data || {}; }
  model.prototype.fields = {}
  model.prototype.errors = function(){
    var errors = {}
      , fields = this.fields
      , provided = this.data
      , expectedFields = Object.keys(fields);
    
    expectedFields.forEach(function(k){
      var errorType;
      if (!provided[k] && fields[k].required) {
        errorType = 'missing';
      } else {
          fields[k].validators.forEach(function(validator){
          try { validator(provided[k]); }
          catch (e) { errorType = e.message;  }
        });
      }
      if (errorType) {
        errors[k] = errorType;
      }
    })
    return errors;
  }
  return model;
};

var RegEx = function(regex, type){
  return function(input){
    if (!regex.test(input)) throw new Error(type || 'regexp');
  };
};
var ISODate = function(){
  return function(input){
    var parsed = new Date(Date.parse(input))
    if (isNaN(parsed.getDate())) throw new Error('isodate');
  };
};
var Email = function(){
  // more or less RFC 2822
  var regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  return RegEx(regex, 'email');
};
var MaxLength = function(len){
  return function(input) {
    if (input.length > len) throw new Error('length');
  };
};
var URL = function(){
  var fq_url = /^(https?):\/\/[^\s\/$.?#].[^\s]*$/;
  var local_url = /^\/\S+$/;
  return function(input) {
    try { RegEx(fq_url, 'url')(input); }
    catch(e) { RegEx(local_url, 'url')(input); }
  };
};

var field = function(required, validators){ return { required: required, validators: validators }; };
var required = function() { return field(true, Array.prototype.slice.call(arguments)); };
var optional = function() { return field(false, Array.prototype.slice.call(arguments)); };

var Assertion = model_factory();
var Badge = model_factory();
var Issuer = model_factory();

Assertion.prototype.fields = {
  recipient : required(Email()),
  //badge     : required(),
  evidence  : optional(URL()),
  expires   : optional(ISODate()),
  issued_at : optional(ISODate())
};
Badge.prototype.fields = {
  version     : required(RegEx(/^v?\d+\.\d+\.\d+$/)),
  name        : required(MaxLength(128)),
  description : required(MaxLength(128)),
  image       : required(URL()),
  criteria    : required(URL()),
  //issuer      : required()
};
Issuer.prototype.fields = {
  name    : required(MaxLength(128)),
  org     : optional(MaxLength(128)),
  contact : optional(Email()),
  url     : optional(URL())
};

exports.validate = function(assertion){
  return { status: 'okay', error: [] };
};

// Internal testing.
var run_tests = function() {
  var vows = require('vows')
    , assert = require('assert')
    , fixtures = {
        badge: function(){ return {
          version: 'v0.5.0',
          name: 'HTML5',
          description: 'For rocking in the free world',
          image: '/html5.png',
          criteria: 'http://example.com/criteria.html'
        }},
        fixture: function(){ return {
          recipient: 'bimmy@example.com',
          evidence: '/bimmy-badge.json',
          expires: '2040-08-13',
          issued_at: '2011-08-23'
        }},
        issuer: function(){ return {
          name: 'p2pu',
          org: 'school of webcraft',
          contact: 'admin@p2pu.org',
          url: 'http://p2pu.org/schools/sow'
        }}
      };
  
  vows.describe('internal').addBatch({
    'A Badge prototype': {
      topic: (Badge.prototype),
      'has `fields`': function(topic) {
        assert.include(topic, 'fields');
      }
    },
    
    'A Badge instance': {
      topic: (new Badge(fixtures.badge())),
      'has `data`, `fields` and `errors` method': function(topic){
        assert.include(topic, 'data');
        // will be in prototype chain, not on object.
        assert.ok(topic.fields);
        assert.ok(topic.errors);
      },
      'has expected data': function(topic){
        var supplied = fixtures.badge();
        assert.equal(topic.data.name, supplied.name);
      },
      'missing all fields': {
        topic: new Badge(),
        'will have all errors': function(topic){
          // currently 5 required fields.
          var errors = topic.errors()
          assert.equal(Object.keys(errors).length, 5);
        },
        'will have all `missing` errors': function(topic){
          var errors = topic.errors();
          Object.keys(errors).forEach(function(k){
            assert.equal(errors[k], 'missing');
          })
        }
      },
      'with invalid `criteria` and `image`': {
        'topic': function(){
          var d = fixtures.badge();
          d.criteria = 'not-a-good-url';
          d.image = 'ftp://even-worse-url.com/';
          return new Badge(d);
        },
        'will have two errors': function(topic){
          var errors = topic.errors();
          assert.equal(Object.keys(errors).length, 2);
        }
      }
    },
    
    'A Validator': {
      'of MaxLength': {
        topic: function(){ return function(len){ return MaxLength(len);} },
        'should trip if above length': function(topic) {
          var str = 'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwhat';
          assert.throws(function(){
            topic(str.length - 1)(str);
          }, Error);
        },
        'should not trip if at length': function(topic) {
          var str = 'www';
          assert.doesNotThrow(function(){
            topic(str.length)(str);
          }, Error);
        },
        'should not trip if below length': function(topic) {
          var str = '1';
          assert.doesNotThrow(function(){
            topic(str.length + 1)(str);
          }, Error);
        },
        'should be able to co-exist': function(topic) {
          var one = topic(1);
          var two = topic(2);
          assert.doesNotThrow(function(){ one('1'); }, Error);
          assert.doesNotThrow(function(){ two('22'); }, Error);
          assert.throws(function(){ one('22'); }, Error);
        }
      },
      'of URLs': {
        topic: function(){ return function(){ return URL();} },
        'should pass with fqdn': function(topic){
          assert.doesNotThrow(function(){
            topic()('http://google.com/');
          }, Error);
        },
        'should pass with relative': function(topic){
          assert.doesNotThrow(function(){
            topic()('/google/bots');
          }, Error);
        },
        'should fail with wrong scheme': function(topic){
          assert.throws(function(){
            topic()('ftp://google.com/bots');
          }, Error);
        },
        'should pass with port': function(topic){
          assert.doesNotThrow(function(){
            topic()('https://google.com:443/');
          }, Error);
        }
      },
      'of ISODates': {
        topic: function(){ return function(){ return ISODate();} },
        'should pass with good date': function(topic) {
          assert.doesNotThrow(function(){ topic()('2010-09-10'); });
        },
        'should pass with good time': function(topic) {
          assert.doesNotThrow(function(){ topic()('2010-09-10T21:00:00'); });
        },
        'should fail with bad dates': function(topic) {
          assert.throws(function(){ topic()('2010-09-40'); });
          assert.throws(function(){ topic()('10000-500-10'); })
          assert.throws(function(){ topic()('2010-22-10'); })
        }
      },
      'of Emails': {
        topic: function(){ return function(){ return Email();} },
        'should pass with good email': function(topic) {
          assert.doesNotThrow(function(){ topic()('b@example.com'); });
          assert.doesNotThrow(function(){ topic()('b@e.com'); });
          assert.doesNotThrow(function(){ topic()('yo@domain.local.com'); });
          assert.doesNotThrow(function(){ topic()('first.last@domain.local.com'); });
        },
        'should fail with bad email': function(topic) {
          assert.throws(function(){ topic()('b@ex'); });
          assert.throws(function(){ topic()('@whatlolcom'); });
          assert.throws(function(){ topic()('no-at-at-alll'); });
          assert.throws(function(){ topic()('12902@@@.com'); });
        },
        'should throw `email` message': function(topic) {
          try { topic()('b@ex') }
          catch (e) { assert.equal(e.message, 'email'); }
        }
      }
    }
  }).run()
}
run_tests()
