var vows = require('vows')
  , mysql = require('../lib/mysql')
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

mysql.prepareTesting();
vows.describe('Awarding Badges').addBatch({
  'An awarded badge' : {
    topic: function() { award(assertion, 'http://example.com/this-badge', PNGDATA, this.callback) },
    'gets awarded without error': function(err, badge){
      assert.ifError(err);
    },
    'can be retrieved' : {
      topic: function(err, badge) {
        award(assertion, 'http://example.com/this-badge', PNGDATA, function(err, badge){
          Badge.find({'endpoint': 'http://example.com/this-badge'}, this.callback)
        }.bind(this));
      },
      'and updated without duplicating': function(err, badges) {
        assert.equal(badges.length, 1);
      },
      'and has expected imagePath': function(err, badges) {
        var path = badgeDir.replace(/^.*?static/, '');
        assert.ok(badges[0].data.image_path.match(path));
      }
    }
  }
}).export(module)