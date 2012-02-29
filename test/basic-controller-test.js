var fs = require('fs')
  , path = require('path')
  , vows = require('vows')
  , assert = require('assert')

var controllers = fs.readdirSync(path.join(__dirname, '../controllers'));

var testGen = function(files) {
  var test = {};
  for (var i = files.length; i--; ) {
    test[files[i]] = (function(mod){
      return function(){ assert.ok(require('../controllers/' + mod)); }
    }(files[i].replace('.js', '')));
  }
  return test;
}

vows.describe('Controller sanity').addBatch({
  'Controller': {
    topic: controllers,
    'exists': function (files){
      assert.ok(files);
      assert.ok(files.length > 0);
    },
    'import test: ': testGen(controllers)
  }
}).export(module);
  
