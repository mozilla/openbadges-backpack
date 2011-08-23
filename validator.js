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

var field = function(required, validators){ return { required: required, validators: validators }; };
var required = function() { return field(true, Array.prototype.slice.call(arguments)); };
var optional = function() { return field(false, Array.prototype.slice.call(arguments)); };

var Assertion = model_factory()
var Badge = model_factory()
var Issuer = model_factory()

Assertion.prototype.fields = {
  recipient : required(),
  badge     : required(),
  evidence  : optional(),
  expires   : optional(),
  issued_at : optional()
}
Badge.prototype.fields = {
  version     : required(),
  name        : required(),
  image       : required(),
  description : required(),
  criteria    : required(),
  issuer      : required()
}
Issuer.prototype.fields = {
  name    : required(),
  org     : optional(),
  contact : optional(),
  url     : optional()
}

exports.validate = function(assertion){
  return {status: 'okay', error: []}
}

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
    }
  }).run()
}
run_tests()


