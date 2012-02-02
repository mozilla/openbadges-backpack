var vows = require('vows')
  , assert = require('assert')
  , baker = require('../lib/baker')
  , path = require('path')

var PNGFILE = path.join(__dirname, '/utils/images/no-badge-data.png')
vows.describe('bake some badges').addBatch({
  'A clean PNG': {
    'should fail if not given data': function(){
      assert.throws(function(){ baker.prepare(PNGFILE) }, Error);
    },
    'can be a prepared with badge data': function(){
      var badge = baker.prepare(PNGFILE, 'https://location-of-badge');
      var data = baker.getDataFromImage(badge);
      assert.equal(data, 'https://location-of-badge');
    },
  },
  'A prepared PNG': {
    topic: function(){
      return baker.prepare(PNGFILE, 'https://location-of-badge');
    },
    'should fail if it tries to get baked again': function(buf){
      assert.throws(function(){ baker.prepare(buf, 'new-stuff') }, Error);
    }
  }
}).export(module);