var vows = require('vows')
  , mysql = require('../lib/mysql')
  , assert = require('assert')
  , award = require('../lib/award')
  , fs = require('fs')
  , path = require('path')
  , assertion = require('../lib/utils').fixture()
  , Badge = require('../models/badge')
  , configuration = require('../lib/configuration')
  , badgeDir = configuration.get('badge_path')

var PNGFILE = path.join(__dirname, '/utils/images/no-badge-data.png')
  , PNGDATA = fs.readFileSync(PNGFILE)

vows.describe('Awarding Badges').addBatch({
  'Awarding:': {
    topic: function () {      
      mysql.prepareTesting(this.callback);
    },
    'An awarded badge' : {
      topic: function() {
        award({
          assertion: assertion,
          url: 'http://example.com/this-badge',
          imagedata: PNGDATA,
          recipient: assertion.recipient
        }, this.callback)
      },
      'gets awarded without error': function(err, badge){
        assert.ifError(err);
      },
      'can be retrieved' : {
        topic: function(err, badge) {
          award({
            assertion: assertion,
            url: 'http://example.com/this-badge',
            imagedata: PNGDATA,
            recipient: assertion.recipient
          }, function(err, badge){
            Badge.find({'endpoint': 'http://example.com/this-badge'}, this.callback)
          }.bind(this));
        },
        'and updated without duplicating': function(err, badges) {
          assert.equal(badges.length, 1);
        },
        'and has expected imagePath': function(err, badges) {
          var path = badgeDir.replace(/^.*?static/, '');
          assert.ok(badges[0].get('image_path').match(path));
        }
      }
    }
  }
}).export(module)