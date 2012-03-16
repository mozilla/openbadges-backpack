// Library for making and parsing requests to remote resources.
var request = require('request')
  , metapng = require('metapng')
  , Badge = require('../models/badge')
  , logger = require('./logging').logger
  , _ = require('underscore');

var MAX_RESPONSE_SIZE = 1024*256;

// Pull down the badge image and do something with the image data.
exports.badgeImage = function(url, callback) {
  getRemoteData({url: url, encoding:'binary'}, 'image/png', function(err, data) {
    if (err) return callback(err);
    var pngbuf = Buffer(data, 'binary');
    try {
      metapng.read(pngbuf);
    } catch(e) {
      return callback(_error('parse', 'could not read png file: ' + e));
    }
    return callback(err, pngbuf);
  });
}


/**
 * Get an assertion hosted at a remote site asynchronously
 * 
 * @type asynchronous
 * @param {String} url for hosted assertion
 * @throw {(Error)|ParseError} see errors from `getRemoteData`
 * @return {Object} an object representing a badge assertion.
 */

exports.getHostedAssertion = function (url, callback) {
  var assertionOrError
    , assertion
  
  getRemoteData({ url: url }, 'application/json', function (err, body) {
    var result;
    if (err) return callback(err);
    
    try {
      // if this is a string, parse the hell out of it.
      if (typeof body === 'string') { 
        result = JSON.parse(body);
      }

      // if it's not a string, assume it's already an object and send it back
      else {
        // #TODO: some form of error checking here to make sure it's the type of
        // object we're expecting 
        result = body;
      }
    }

    // this probably means something went wrong with the parsing.
    catch(err) {
      err.type = 'ParseError';
      err.message = 'Failed to parse JSON at ' + url + ': ' + err.message;
      return callback(err, null);
    }
    
    return callback(null, result);
  });
};
 
/**
 * Get some arbitrary remote data.
 * 
 * @type asynchronous
 * @param {Object} opts passed straight through to `request` 
 * @param {String} accepted the expected `content-type` header
 * @throw {UnreachableError|ContentTypeError|SizeError}
 * @return {String} unparsed body of the response.
 * @api private
 */

function getRemoteData (opts, accepted, callback) {
  opts = _.extend(opts, {'User-Agent': 'wutlol'});
  try {
    // do a HEAD request first to see if the URL is reachable and within limits
    request(_.extend(opts, {method: 'head'}), function(err, resp) {
      try {
        assert.reachable(err, resp);
        assert.size(resp);
      } catch(err) { return callback(err); }
      
      request(_.extend(opts, {method: 'get'}), function(err, resp, rawBody) {
        try {
          assert.reachable(err, resp);
          assert.contentType(resp, accepted);
          assert.size(resp, rawBody);
        } catch(err) { return callback(err); }
        
        return callback(null, rawBody);
      })
    })
  } catch(err) { return callback(new UnreachableError()); }
}

/**
 * Create a custom error with the proper inheritance chain.
 * SIDE-EFFECT: Sets an export based on `name`
 *
 * @param {String} name
 * @param {String} defaultMsg
 * @return {ErrorClass} a new error class
 */
    
var CustomError = function (name, defaultMsg) {
  var err = function (msg) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = msg || defaultMsg;
    this.name = name;
  }
  err.prototype.__proto__ = Error.prototype;
  return (exports[name] = err);
};

var RemoteError = CustomError('RemoteError');

var SizeError = CustomError('SizeError', 'Response too big: maximum size is ' + MAX_RESPONSE_SIZE + ' bytes');

var ParseError = CustomError('ParseError', 'Could not parse JSON');

var UnreachableError = CustomError('UnreachableError', 'Could not reach endpoint: invalid url, DNS, 4xx or 5xx');

var ContentTypeError = CustomError('ContentTypeError');

var assert = {
  reachable: function (err, resp) {
    if (err || resp.statusCode >= 400)
      throw new UnreachableError();
  },
  size: function (resp, body) {
    var responseSize = (body ? body.length : resp.headers['content-length']) || 0;
    if (responseSize > MAX_RESPONSE_SIZE)
      throw new SizeError();
  },
  contentType: function (resp, expected) {
    var type = (resp.headers['content-type'])
    if (type.indexOf(expected) !== 0)
      throw new ContentTypeError('Unexpected content-type: Response is `' + type + '`, but expected `' + expected + '`');
  }
};

exports.assert = assert;
exports.MAX_RESPONSE_SIZE = MAX_RESPONSE_SIZE;
