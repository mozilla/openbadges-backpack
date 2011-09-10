var vows = require('./setup')
  , assert = require('assert')
  , award = require('../lib/award')
  , fs = require('fs')
  , path = require('path')
  , assertion = require('./utils').fixture()

var PNGFILE = path.join(__dirname, 'no-badge-data.png')
  , PNGDATA = fs.readFileSync(PNGFILE)

vows.describe('Awarding badges').addBatch({
  'When given good input': {
    topic: function(){ award(assertion, 'http://example.com/', PNGDATA, this.callback); },
    'badges get awarded': function(err, badge) {
      console.dir(badge);
      assert.ok('rad')
    }
  }
}).export(module)
