var vows = require('./setup')
  , assert = require('assert')
  , award = require('../lib/award')
  , fs = require('fs')
  , path = require('path')
  , assertion = require('./utils').fixture()
  , Badge = require('../models/badge')

var PNGFILE = path.join(__dirname, 'no-badge-data.png')
  , PNGDATA = fs.readFileSync(PNGFILE)

vows.describe('Awarding Badges').addBatch({
  'A valid badge' : {
    topic: function() { award(assertion, 'http://example.com/this-badge', PNGDATA, this.callback) },
    'can be awarded': function(err, badge){
      assert.ifError(err);
    },
    'and updated' : {
      topic: function(err, badge) {
        var self = this;
        award(assertion, 'http://example.com/this-badge', PNGDATA, function(err, badge){
          Badge.find({'meta.pingback': 'http://example.com/this-badge'}, self.callback)
        });
      },
      'without duplicating': function(err, docs) {
        assert.length(docs, 1);
      }
    },
  },
}).export(module)