var model_factory = function(){
  var model = function(data){ this.data = data || {}; }
  model.prototype.fields = {}
  model.prototype.validate = function(){
    var errors = []
    var expected = Object.keys(this.fields);
    var provided = Object.keys(this.data);
    console.dir(this.data);
    console.dir(this.fields);
    return errors;
  }
  return model;
};

var ValidationError = function(type) { var e = new Error(type); e.type=type; return e; };

// validators should return methods
var RegEx = function(regex){
  return function(input){
    if (!regex.test(input)) throw new ValidationError('regexp');
  };
};
var ISODate = function(){
  return function(input){
    var parsed = new Date(Date.parse(input))
    if (isNan(parsed.getDate())) throw new ValidationError('isodate');
  };
};
var Email = function(){
  // more or less RFC 2822
  var regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  return RegEx(regex);
};
var MaxLength = function(len){
  return function(input) {
    if (input.length > len) throw new ValidationError('length');
  };
};
var URL = function(){
  var fq_url = /^(https?):\/\/[^\s\/$.?#].[^\s]*$/;
  var local_url = /^\/\S+$/;
  return function(input) {
    try { RegEx(fq_url)(input) }
    catch(e) { RegEx(local_url)(input) }
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
  version     : required(RegEx(/v?\d+\.\d+\.d+/)),
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

// temporary testing: remove this once development is done, test as black-box
var run_tests = function() {
  var vows = require('vows')
    , assert = require('assert');
  
  vows.describe('internal').addBatch({
    'A Badge prototype': {
      topic: (Badge.prototype),
      'has `fields`': function(topic) {
        assert.include(topic, 'fields');
      }
    },
    'A Badge instance': {
      topic: (new Badge({what: 'lol'})),
      'has `data`, `fields` and `validate` method': function(topic){
        assert.include(topic, 'data');
        // will be in prototype chain, not on object.
        assert.ok(topic.fields);
        assert.ok(topic.validate);
      }
    },
    'Maxlength validators': {
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
    }
  }).run()
}
run_tests()
