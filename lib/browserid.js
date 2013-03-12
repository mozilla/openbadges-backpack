const _ = require('underscore');
const request = require('request');

function makeError(opts) {
  return _.extend(new Error(opts.message||opts.code), opts);
}

function isObject(thing) {
  return Object.prototype.toString.call(thing) === '[object Object]';
}

function safeJsonParse(str) {
  if (isObject(str))
    return str;
  try {
    return JSON.parse(str);
  } catch (_) {
    return undefined;
  }
}

function getVerifierUrl(conf) {
  const id = conf.get('identity');
  return id.protocol + '://' +  id.server + id.path;
}

function getAudience(req) {
  return req.headers['host'];
}

/**
 * Verify an assertion and pull data from it.
 *
 * @param {Object} options
 *   - `url`: url for the verifier
 *   - `assertion`: assertion to verify
 *   - `audience`: the expected audience for the assertion
 */
function verifyPersonaAssertion(opts, callback) {
  request.post({
    url: opts.url,
    json: {
      assertion: opts.assertion,
      audience: opts.audience
    },
  }, function (err, res, body) {
    if (err) return callback(makeError({
      message: 'Could not reach Persona assertion verifier',
      code: 'http-request-error',
      extra: err
    }));

    // Immediately bail on any code other than 200.
    if (res.statusCode !== 200) {
      return callback(makeError({
        message: 'Persona verifier did not respond with HTTP 200',
        code: 'invalid-http-status',
        extra: body
      }));
    }

    const verification = safeJsonParse(body);
    if (!verification) {
      return callback(makeError({
        message: 'Could not parse verifier response as JSON',
        code: 'parse-error',
        extra: body
      }));
    }

    // Make sure the verifier says this is legit.
    if (verification.status !== 'okay' || !verification.email) {
      return callback(makeError({
        message: 'Persona verifier response not OK.',
        code: 'invalid-assertion',
        extra: body,
      }));
    }

    return callback(null, verification.email);
  });
}

exports.verify = verifyPersonaAssertion;
exports.getAudience = getAudience;
exports.getVerifierUrl = getVerifierUrl