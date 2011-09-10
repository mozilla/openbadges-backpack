var vows = require('./setup')
  , assert = require('assert')
  , award = require('../lib/award')
  , fs = require('fs')
  , path = require('path')
  , assertion = require('./utils').fixture()

var PNGFILE = path.join(__dirname, 'no-badge-data.png')
  , PNGDATA = fs.readFileSync(PNGFILE)

vows.describe('Awarding Badges').addBatch({
  'A valid badge' : {
    topic: function() { award(assertion, 'http://example.com/', PNGDATA, this.callback) },
    'can be awarded': function(err, badge){
      assert.ok(!err);
    }
  }
}).export(module)