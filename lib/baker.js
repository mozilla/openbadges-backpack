// This depends on the metapng module – https://github.com/brianlovesdata/metapng.js
var metapng = require('metapng');
var KEYWORD = 'openbadges';

// Creates a new buffer with `data` written as a tEXt chunk under the
// `KEYWORD` keyword. It's important that only one of these exists – it
// doesn't make sense for a single badge image to contain multiple assertions.
exports.prepare = function(pnginput, data) {
  if (!data) throw new Error('must have data to write');
  try {
    return metapng.writeOne(pnginput, KEYWORD, data);
  } catch(e) {
    throw new Error('could not bake badge: ' + e);
  }
}

// Get back the string representing the assertion. As of 9/7/2011, this is
// going to be a URL but in the future it will be the signed assertion in JWT
// format. If we get back more than one assertion from the PNG, error out.
exports.read = function(pnginput) {
  var badgedata = metapng.read(pnginput, KEYWORD);
  if (badgedata.length > 1) throw Error('more than one set of badge data');
  return badgedata.toString('utf-8');
}
