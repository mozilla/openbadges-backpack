var vows = require('vows')
  , assert = require('assert')
  , validate = require('../validator').validate


vows.describe('Badge Validator').addBatch({
  'when validating anything': {
    topic: function() { return validate({}) },
    'we get a structure': {
      'with a `status` member': function(topic) {
        assert.include(topic, 'status')
      },
      'with a `errors` member': function(topic) {
        assert.include(topic, 'error')
      }
    }
  }
}).export(module);