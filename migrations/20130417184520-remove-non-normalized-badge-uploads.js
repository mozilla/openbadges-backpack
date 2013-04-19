var dbm = require('db-migrate');
var type = dbm.dataType;
var validator = require('openbadges-validator');
var normalizeAssertion = require('../lib/normalize-assertion');

exports.up = function(db, callback) {
  /* goodPattern is intended to match where body.badge is an object.
     Bad badges have a url instead, and those seem to be the two possibilities.

     Restoring isn't a good option because the data at the badge and issuer urls 
     may not exist any more. Additionally, because the bug prevented users from
     seeing their badges, this deletes badges they never knew they had in their
     backpacks in the first place.
   */
  var goodPattern = '"badge":{'; 
  db.runSql("DELETE FROM `badge` WHERE `body` NOT RLIKE ?", [goodPattern], callback);
};

exports.down = function(db, callback) {
  // No way to recover broken badges (and don't want to), 
  // but rest of data should be fine, so noop.
  callback();
};
