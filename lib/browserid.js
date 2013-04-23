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

function getIncludeScriptUrl() {
  return "https://login.persona.org/include.js";
}

exports.getAudience = getAudience;
exports.getVerifierUrl = getVerifierUrl;

// Configure the module.
//
// Options:
//
//   testUser:
//
//     This option is used for testing BrowserID/Persona without
//     actually talking to the service.
//
//     If non-falsy, the value should be either an email address, or the
//     word 'error' or 'prompt'.
//
//     In all cases, this module's exports are modified to
//     have navigator.id.get() return a fake assertion on the browser side,
//     and to have this module's verify() function process the fake
//     assertion on the server side.
//
//     If the value is an email address, then the given user is always
//     successfully validated.
//
//     If it is 'error', then this module's verify() function always
//     returns an error condition.
//
//     If it is 'prompt', then the user is prompted for an email address
//     when navigator.id.get() is called, and whatever they type is
//     used as an email address. They can also enter 'error', in which
//     case this module's verify() function fails.

exports.configure = function(options) {
  options = options || {};

  var testUser = options.testUser;

  if (!testUser) {
    exports.verify = verifyPersonaAssertion;
    exports.getIncludeScriptUrl = getIncludeScriptUrl;
    return;
  }

  exports.verify = function fakeVerify(opts, callback) {
    setTimeout(function() {
      if (opts.assertion == 'error')
        callback(makeError({
          message: 'Persona verifier response not OK.',
          code: 'invalid-assertion',
          extra: 'sent from fakeVerify',
        }));
      else
        callback(null, opts.assertion);
    }, 0);
  };
  exports.getIncludeScriptUrl = function fakeGetIncludeScriptUrl() {
    function fakeBrowserId(testUser) {
      if (!navigator.id) navigator.id = {};
      navigator.id.get = function(callback) {
        if (testUser == 'prompt')
          testUser = prompt("Enter your email address");
        setTimeout(function() { callback(testUser); }, 0);
      };
    };

    var js = "(" + fakeBrowserId + ")(" + JSON.stringify(testUser) + ");";

    return "data:application/javascript;base64," + 
           new Buffer(js).toString('base64');
  };
};

exports.configure();
