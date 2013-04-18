var dbm = require('db-migrate');
var type = dbm.dataType;
var validator = require('openbadges-validator');
var normalizeAssertion = require('../lib/normalize-assertion');

exports.up = function(db, callback) {
  /* goodPattern is intended to match where body.badge is an object.
     What we really want is to find badges where body.badge is a url.
   */
  var goodPattern = '"badge":{'; 
  db.runSql("SELECT id, body FROM `badge` WHERE `body` NOT RLIKE ?", [goodPattern], function(err, results){
    if (err) callback(err);
    if (!results.length) callback();
    results.forEach(function(result) {
      var id = result.id;
      var body = JSON.parse(result.body);
      validator(body, function(err, info) {
        if (err) callback(err);
        var newBody = JSON.stringify(normalizeAssertion(info));
        db.runSql("UPDATE `badge` SET `badge`.`body` = ? WHERE `badge`.`id` = ?", [ newBody, id ], callback);
      });
    });
  });
};

exports.down = function(db, callback) {
  // No way to recover broken badges (and don't want to), 
  // but rest of data should be fine, so noop.
  callback();
};
