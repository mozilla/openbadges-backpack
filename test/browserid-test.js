const vm = require('vm');
const $ = require('./');
const test = require('tap').test;
const browserid = require('../lib/browserid');

const ASSERTION = '1234';
const AUDIENCE = 'localhost';

test('verify: good verifier response', function (t) {
  $.mockHttp()
    .post('/good', { assertion: ASSERTION, audience: AUDIENCE })
    .reply(200, {status: 'okay', email: $.EMAIL})
  browserid.verify({
    url: $.makeUrl('/good'),
    assertion: ASSERTION,
    audience: AUDIENCE,
  }, function (err, email) {
    t.same(email, $.EMAIL);
    t.end();
  });
});

test('verify: unparsable json', function (t) {
  $.mockHttp()
    .filteringRequestBody(/.*/, '*')
    .post('/bad', '*')
    .reply(200, 'unparseable')
  browserid.verify({
    url: $.makeUrl('/bad'),
    assertion: ASSERTION,
    audience: AUDIENCE,
  }, function (err, email) {
    t.same(err.code, 'parse-error');
    t.end();
  });
});

test('verify: bad http status', function (t) {
  $.mockHttp()
    .filteringRequestBody(/.*/, '*')
    .post('/bad', '*')
    .reply(500, 'down')
  browserid.verify({
    url: $.makeUrl('/bad'),
    assertion: ASSERTION,
    audience: AUDIENCE,
  }, function (err, email) {
    t.same(err.code, 'invalid-http-status');
    t.end();
  });
});

test('verify: bad verifier response', function (t) {
  $.mockHttp()
    .filteringRequestBody(/.*/, '*')
    .post('/bad', '*')
    .reply(200, { status: 'bad', reason: 'whatever' })
  browserid.verify({
    url: $.makeUrl('/bad'),
    assertion: ASSERTION,
    audience: AUDIENCE,
  }, function (err, email) {
    t.same(err.code, 'invalid-assertion');
    t.end();
  });
});

test('getAudience', function (t) {
  const req = {
    headers: {
      host: 'localhost'
    }
  };
  const aud = browserid.getAudience(req);
  t.same(aud, 'localhost');
  t.end();
});

test('getVerifierUrl', function (t) {
  const url = browserid.getVerifierUrl({
    identity: {
      protocol: 'https',
      server: 'localhost',
      path: '/verify'
    },
    get: function (key) { return this[key] }
  });
  t.same(url, 'https://localhost/verify');
  t.end();
});

test('getIncludeScriptUrl', function(t) {
  t.same(browserid.getIncludeScriptUrl(),
         "https://login.persona.org/include.js");
  t.end();
});

test('configure defaults work', function(t) {
  var origVerify = browserid.verify;
  var origGetIncludeScriptUrl = browserid.getIncludeScriptUrl;

  browserid.configure();
  t.equal(browserid.verify, origVerify);
  t.equal(browserid.getIncludeScriptUrl, origGetIncludeScriptUrl);

  browserid.configure({testUser: null});
  t.equal(browserid.verify, origVerify);
  t.equal(browserid.getIncludeScriptUrl, origGetIncludeScriptUrl);

  t.end();
});

test('configure works when testUser="error"', function(t) {
  browserid.configure({testUser: 'error'});
  browserid.verify({assertion: 'error'}, function(err) {
    t.same(err.code, 'invalid-assertion');
    t.same(err.extra, 'sent from fakeVerify');
    t.end();
  });
});

test('configure works when testUser="prompt" or email addr', function(t) {
  var FAKE_PROMPT_RESULT = "foo@bar.org";
  var navigatorIdGet = function(cb) {
    var url = browserid.getIncludeScriptUrl();
    var base64 = url.split("data:application/javascript;base64,")[1];
    var js = new Buffer(base64, 'base64').toString('ascii');

    var sandbox = {
      navigator: {},
      prompt: function() { return FAKE_PROMPT_RESULT; },
      setTimeout: setTimeout
    };

    vm.runInNewContext(js, sandbox);
    sandbox.navigator.id.get(cb);
  };

  browserid.configure({testUser: 'prompt'});
  navigatorIdGet(function(assertion) {
    t.same(assertion, FAKE_PROMPT_RESULT);
    browserid.configure({testUser: 'lol@cat.org'});
    navigatorIdGet(function(assertion) {
      t.same(assertion, "lol@cat.org");
      t.end();
    });
  });
});
