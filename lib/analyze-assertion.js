const _ = require('underscore');
const request = require('request');
const validator = require('openbadges-validator');

function makeError(opts) {
  const error = _.extend(new Error(opts.message), opts);
  return Object.defineProperty(error, 'message', { enumerable: true });
}

function safeJsonParse(thing) {
  try { return JSON.parse(thing) }
  catch(e) { return null }
}

function getAssertion(url, callback) {
  request.get(url, function (error, response, body) {
    if (error)
      return callback(makeError({
        message: 'could not get assertion: unreachable',
        code: 'http-unreachable',
        extra: error
      }));
    if (parseInt(response.statusCode, 10) >= 400)
      return callback(makeError({
        message: 'could not get assertion: invalid http response',
        code: 'http-status',
        extra: response.statusCode
      }));
    const result = safeJsonParse(body);
    if (!result)
      return callback(makeError({
        message: 'could not get assertion: invalid JSON',
        code: 'parse',
      }));
    return callback(null, result);
  });
}

function internalClass(thing) {
  return Object.prototype.toString.call(thing);
}

function isObject(thing) {
  return internalClass(thing) === '[object Object]';
}

module.exports = function analyze(thing, callback) {
  if (/^http/.exec(thing)) {
    return getAssertion(thing, function (error, assertion) {
      if (error)
        return callback(error);
      return validator(assertion, callback)
    });
  }
  if (isObject(thing) || validator.isSignedBadge(thing))
    return validator(thing, callback);
  return callback(makeError({
    name: 'TypeError',
    message: 'invalid input: requires valid url, assertion, or signature',
    code: 'input',
  }));
}