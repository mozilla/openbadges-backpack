// Library for making and parsing requests to remote resources.
var request = require('request');
var metapng = require('metapng');
var Badge = require('../models/badge');
var logger = require('./logging').logger;
var util = require('util');
var _ = require('underscore');

var MAX_RESPONSE_SIZE = 1024 * 256;

/**
 * Get a remote badge image and make sure it's a real PNG.
 *
 * @type asynchronous
 * @param {String} url location of image
 * @return {ParseError, Buffer}
 *   - if the image is not a PNG or cannot be read
 *   - buffer containing the raw png bytes.
 */

exports.badgeImage = function (url, callback) {
  var opts = { url: url, encoding: 'binary' };

  getRemoteData(opts, 'image/png', function (err, data) {
    var pngbuf, parseError;
    if (err) return callback(err);
    pngbuf = Buffer(data, 'binary');
    try {
      metapng.read(pngbuf);
    } catch (e) {
      parseError = new ParseError('could not read png file: ' + e);
      return callback(parseError);
    }
    return callback(null, pngbuf);
  });
};


/**
 * Get an assertion hosted at a remote site asynchronously
 *
 * @type asynchronous
 * @param {String} url for hosted assertion
 * @return {(Error|ParseError), Object}
 *   - see errors from `getRemoteData`
 *   - an object representing a badge assertion.
 */

exports.getHostedAssertion = function (url, callback) {
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
    catch (err) {
      var newErr = new ParseError('Failed to parse JSON at ' + url + ': ' + err.message);
      return callback(newErr, null);
    }

    return callback(null, result);
  });
};

/**
 * Get some arbitrary remote data.
 *
 * @private
 * @type asynchronous
 * @param {Object} opts passed straight through to `request`
 * @param {String} accepted the expected `content-type` header
 * @throw {UnreachableError|ContentTypeError|SizeError}
 * @return {String} unparsed body of the response.
 */

function getRemoteData(opts, accepted, callback) {
  var msg = ({
    'image/png' : 'Unable to retrieve image from the following url: ',
    'application/json': 'Unable to retrieve assertion from the following url: '
  })[accepted] + opts.url;

  opts = _.extend(opts, { 'User-Agent': 'wutlol' });
  try {
    // do a HEAD request first to see if the URL is reachable and within limits
    request(_.extend(opts, { method: 'HEAD' }), function (err, resp) {
      try {
        assert.reachable(err, resp, msg);
        assert.size(resp);
      } catch (err) { return callback(err); }

     request(_.extend(opts, { method: 'GET' }), function (err, resp, rawBody) {
       try {
          if (opts.url.match(/emoti/) && !opts.url.match(/\.png/)) {
            logger.debug('debugging for mouse');
            logger.debug('url is ' + opts.url);
            logger.debug('body is ' + rawBody);
            logger.debug('resp is ' + util.inspect(resp, null, null, true));
          }

          assert.reachable(err, resp, msg);
          assert.contentType(resp, accepted);
          assert.size(resp, rawBody);
        } catch (err) { return callback(err); }

        return callback(null, rawBody);
      });
    });
  } catch (err) {
    return callback(new UnreachableError("This seems to be an invalid url (or there was a DNS error): " + opts.url));
  }
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
  function err(msg) {
    Error.call(this);
    Error.captureStackTrace(this, err);
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
  reachable: function (err, resp, msg) {
    if (err || resp.statusCode >= 400)
      throw new UnreachableError(msg);
  },
  size: function (resp, body) {
    var responseSize = (body ? body.length : resp.headers['content-length']) || 0;
    if (responseSize > MAX_RESPONSE_SIZE)
      throw new SizeError();
  },
  contentType: function (resp, expected) {
    var type = (resp.headers['content-type'] || "");
    if (type.indexOf(expected) !== 0)
      throw new ContentTypeError('Unexpected content-type: Response is `' + type + '`, but expected `' + expected + '`');
  }
};

exports.assert = assert;
exports.MAX_RESPONSE_SIZE = MAX_RESPONSE_SIZE;
