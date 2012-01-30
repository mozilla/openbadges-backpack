// This depends on the metapng module – https://github.com/brianlovesdata/metapng.js
var metapng = require('metapng')
  , fs = require('fs');
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
};


/**
 * Get back the string representing the assertion.
 * 
 * Currently this will always be a URL but in the future it will be the signed
 * assertion in JWT format. If we get back more than one assertion from the
 * PNG, error out.
 *
 * @param {Buffer} pnginput the raw buffer for the png
 * @return {Error|String} error object or the assertion from the badge. 
 */

exports.read = function(pnginput) {
  var badgedata = metapng.read(pnginput, KEYWORD)
    , err = new Error('More than one `openbadges` keyword in PNG, aborting.');
  if (badgedata.length > 1) {
    err.type = 'parsing_png';
    return err;
  }
  return badgedata.toString('utf-8');
};


/**
 * Get the endpoint url of a hosted assertion from an uploaded badge.
 * // #TODO: support signed assertions.
 *
 * @param {Object} file uploaded file, which includes `size` and `path` attrs
 * @param {Function} callback expecting either `err` or `url` of assertion
 */

exports.urlFromUpload = function (file, callback) {
  var tooBig = new Error('File is too big');
  tooBig.type = 'filesize';
  
  // don't accept badges above 256k. even that's probably too big
  if (file.size > (1024 * 256)) return callback(tooBig);
  
  fs.readFile(file.path, function(err, imagedata) {
    var url;
    
    if (err) {
      err.type = 'reading_file';
      return callback(err);
    }
    
    url = exports.read(imagedata);
    
    if (url instanceof Error) return callback(err);

    return callback(null, url, imagedata);
  })
};