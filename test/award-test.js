var vows = require('./setup')
  , assert = require('assert')
  , award = require('../lib/award')
  , fs = require('fs')
  , path = require('path')
  , assertion = require('./utils').fixture()
  , Badge = require('../models/badge')
  , configuration = require('../lib/configuration')
  , badgeDir = configuration.get('badge_path')

var PNGFILE = path.join(__dirname, 'no-badge-data.png')
  , PNGDATA = fs.readFileSync(PNGFILE)

Badge.collection.drop();
vows.describe('Awarding Badges').addBatch({
  'An awarded badge' : {
    topic: function() { award(assertion, 'http://example.com/this-badge', PNGDATA, this.callback) },
    'gets awarded without error': function(err, badge){
      assert.ifError(err);
    },
    'can be retrieved' : {
      topic: function(err, badge) {
        var self = this;
        award(assertion, 'http://example.com/this-badge', PNGDATA, function(err, badge){
          Badge.find({'meta.pingback': 'http://example.com/this-badge'}, self.callback)
        });
      },
      'and updated without duplicating': function(err, docs) {
        assert.length(docs, 1);
      },
      'and has expected imagePath': function(err, docs) {
        var path = badgeDir.replace(/^.*?static/, '');
        assert.ok(docs[0].meta.imagePath.match(path));
      }
    },
  },
}).export(module)