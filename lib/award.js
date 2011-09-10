// #TODO: evaluate where this method actually belongs; test coverage
var fs = require('fs')
  , path = require('path')
  , crypto = require('crypto')
  , logger = require('./logging').logger
  , configuration = require('./configuration')
  , UserBadge = require('../models/userbadge')

var hashObject = function(obj) {
  var sum = crypto.createHash('md5')
    , serialized = JSON.stringify(obj)
  return sum.update(serialized).digest('hex');
}  

var award = module.exports = function(assertion, url, imagedata, callback) {
  var badgeDir = configuration.get('badge_path')
    , filename = hashObject(assertion) + '.png'
    , filepath = path.join(badgeDir, filename)
  
  callback = callback || function(){};
  fs.writeFile(filepath, imagedata, function(err){
    if (err) {
      logger.warn('error saving badge image');
      callback(err);
      return console.dir(err);
    }
    
    var badge = UserBadge(assertion, {
      pingback: url,
      // #TODO: don't hardcode this.
      imagePath: '/_badges/' + filename,
      // image: imagedata.toString('base64'),
    });
    
    badge.save(function(err, badge){
      if (err) {
        logger.warn('error saving badge to database')
        callback(err);
        return console.dir(err);
      }
      logger.info('saved new badge');
      callback(null, badge);
      return console.dir(badge);
    })
  });
}
