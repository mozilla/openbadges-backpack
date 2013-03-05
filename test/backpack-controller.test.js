const _ = require('underscore');
const test = require('tap').test;
const testUtils = require('./');
const backpack = require('../controllers/backpack');
const conmock = require('./conmock');

test('backpack#login', function (t) {
  conmock({
    handler: backpack.login,
    request: {
      session: { _csrf: 'cats' }
    }
  }, function (err, mock) {
    t.same(mock.fntype, 'render', 'should try to render the login page');
    t.same(mock.options['csrfToken'], 'cats', 'should have right csrf token');
    t.end();
  });
});

test('backpack#signout', function (t) {
  conmock({
    handler: backpack.signout,
    request: {
      session: { email: 'brian@example.org' }
    }
  }, function (err, mock, req) {
    t.same(mock.path, '/backpack/login', 'should redirect to the login page');
    t.same(_.keys(req.session).length, 0, 'should wipe out the session');
    t.end();
  });
});

test('backpack#manage', function (t) {
  // #TODO: re-write after making backpack.manage sane.
  t.end();
});

test('backpack#settings redirects to login if no user', function (t) {
  conmock({handler: backpack.settings()}, function(err, mock) {
    t.same(mock.status, 303);
    t.same(mock.path, "/backpack/login");
    t.end();
  });
});

test('backpack#settings handles summarizeForUser() errors', function (t) {
  conmock({
    handler: backpack.settings({
      backpackConnectModel: {
        summarizeForUser: function(id, cb) {
          cb(new Error("SUMMARIZE ERROR"));
        }
      }
    }),
    request: {user: {get: function() {}}}
  }, function(err, mock) {
    t.same(mock.fntype, 'next');
    t.same(mock.nextErr.message, 'SUMMARIZE ERROR');
    t.end();
  });
});

test('backpack#settings works', function (t) {
  conmock({
    handler: backpack.settings({
      backpackConnectModel: {
        summarizeForUser: function(id, cb) {
          t.same(id, 5);
          cb(null, [{origin: "http://foo.org", permissions: ["bar"]}]);
        }
      }
    }),
    request: {
      user: {get: function() { return 5; }},
      session: {_csrf: "csrf"}
    }
  }, function(err, mock) {
    t.same(mock.fntype, 'render');
    t.same(mock.headers, {
      "Cache-Control" : "no-cache, must-revalidate"
    });
    t.same(mock.options, {
      error: undefined,
      success: undefined,
      csrfToken: "csrf",
      services: {},
      issuers: [{
        origin: "http://foo.org",
        domain: "foo.org",
        permissions: ["bar"]
      }]
    });
    t.end();
  });
});

testUtils.finish(test);