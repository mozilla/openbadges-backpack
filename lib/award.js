// #TODO: evaluate where this method actually belongs; test coverage
var fs = require('fs')
  , path = require('path')
  , crypto = require('crypto')
  , logger = require('./logging').logger
  , configuration = require('./configuration')
  , Badge = require('../models/badge')

var hashObject = function(obj) {
  var sum = crypto.createHash('md5')
    , serialized = JSON.stringify(obj)
  return sum.update(serialized).digest('hex');
}  

var award = module.exports = function(assertion, url, imagedata, callback) {
  var badgeDir = configuration.get('badge_path')
    , filename = hashObject(assertion) + '.png'
    , filepath = path.join(badgeDir, filename)
    , query = {'meta.pingback': url}
  
  callback = callback || function(){};
  fs.writeFile(filepath, imagedata, function(err){
    var badge;
    if (err) return callback(err);
    badge = new Badge(assertion);
    badge.meta = {
      pingback: url,
      // #TODO: don't hardcode this.
      imagePath: '/_badges/' + filename,
      //image: imagedata.toString('base64')
    };

    badge.validate(function(err){
      if (err) return callback(err);
      Badge.update({badge: assertion.badge}, assertion, {upsert: true}, callback);
    })
  })

}
