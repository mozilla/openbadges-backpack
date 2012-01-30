var fs = require('fs')
  , path = require('path')
  , crypto = require('crypto')
  , logger = require('./logging').logger
  , configuration = require('./configuration')
  , Badge = require('../models/badge')
  , User = require('../models/User')

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
  
  User.findOrCreate(assertion.recipient, function (err, user) {
    if (err) { return callback(err); }
    
    fs.writeFile(filepath, imagedata, function(err){
      if (err) return callback(err);
      
      var badge = new Badge({
        body: assertion,
        user_id: user.data.id,
        type: 'hosted',
        endpoint: url,
        image_path: path.join(badgeDir.replace(/^.*?static/, ''), filename)
      });

      badge.save(function (err, badge) {
        if (err) { return callback(err); }
        return callback(null, badge);
      })
    })
  })
}
