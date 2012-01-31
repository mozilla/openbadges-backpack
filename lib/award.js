var fs = require('fs')
  , path = require('path')
  , crypto = require('crypto')
  , logger = require('./logging').logger
  , configuration = require('./configuration')
  , Badge = require('../models/badge')
  , User = require('../models/User')

/**
 * Hash an object using md5 to generate a unique name.
 * 
 * @param {Object} obj the object which will get serialized and hashed
 * @return {String} md5 hash of the serialized object.
 */

var md5obj = function(obj) {
  var sum = crypto.createHash('md5')
    , serialized = JSON.stringify(obj)
  return sum.update(serialized).digest('hex');
}


/**
 * Associated an incoming badge with a user.
 * - User is created if necessary by `User.findOrCreate`
 * - Depends on configuration variable `badge_path`
 *
 * @param {Object} assertion the badge assertion to save
 * @param {String} url the URL endpoint at the issuer where the assertion is hosted
 * @param {Buffer} imagedata the image data for the badge image (pre-baked).
 * @param {Function} callback function expecting an error object or a badge object.
 */

function award (assertion, url, imagedata, callback) {
  var badgeDir = configuration.get('badge_path')
    , filename = md5obj(assertion) + '.png'
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

module.exports = award;