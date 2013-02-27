const url = require('url');

const test = require('tap').test;
const testUtils = require('./');
const conmock = require('./conmock');

const BPCSession = require('../models/backpack-connect').SessionFactory({
  now: function() { return nowSecs * 1000; },
  tokenLifetime: 1000,
  uid: function() { return "SOME_UID_" + (++uid); },
  validPermissions: ["foo_perm"]
});
const User = require('../models/user');
const BackpackConnect = require('../controllers/backpack-connect');
const bpc = new BackpackConnect({
  Model: BPCSession,
  apiRoot: 'http://backpack.org/test_api',
  realm: 'test'
});
const b64enc = function(s) { return new Buffer(s).toString('base64'); };
var uid = 0;
var nowSecs = 0;

testUtils.prepareDatabase({
  '1-real-user': new User({ email: 'brian@example.org' }),
}, function (fixtures) {
  test('refresh() fails w/ no body', function(t) {
    conmock({handler: bpc.refresh()}, function(err, mock) {
      t.equal(mock.status, 400);
      t.same(mock.body, "body expected");
      t.end();
    });
  });

  test('refresh() fails w/ bad grant_type', function(t) {
    conmock({
      handler: bpc.refresh(),
      request: {
        body: {
          grant_type: "something_weird"
        }
      }
    }, function(err, mock) {
      t.equal(mock.status, 400);
      t.same(mock.body, "invalid grant_type");
      t.end();
    });
  });

  test('refresh() fails w/ empty token', function(t) {
    conmock({
      handler: bpc.refresh(),
      request: {
        body: {
          grant_type: "refresh_token",
          refresh_token: ""
        }
      }
    }, function(err, mock) {
      t.equal(mock.status, 400);
      t.same(mock.body, "invalid refresh_token");
      t.end();
    });
  });
  
  test('refresh() fails w/ bad token', function(t) {
    conmock({
      handler: bpc.refresh(),
      request: {
        body: {
          grant_type: "refresh_token",
          refresh_token: "LOL"
        }
      }
    }, function(err, mock) {
      t.equal(mock.status, 400);
      t.same(mock.body, "invalid refresh_token");
      t.end();
    });
  });
  
  test('allowAccess() 403\'s when unauthenticated', function(t) {
    conmock({handler: bpc.allowAccess()}, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 403);
      t.end();
    });
  });

  test('allowAccess() fails w/ no body', function(t) {
    conmock({
      handler: bpc.allowAccess(),
      request: {user: fixtures['1-real-user']}
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'body expected');
      t.end();
    });
  });

  test('allowAccess() fails w/ empty callback', function(t) {
    conmock({
      handler: bpc.allowAccess(),
      request: {
        user: fixtures['1-real-user'],
        body: {callback: ''}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'callback expected');
      t.end();
    });
  });

  test('allowAccess() fails w/ empty scope', function(t) {
    conmock({
      handler: bpc.allowAccess(),
      request: {
        user: fixtures['1-real-user'],
        body: {callback: 'http://foo.org', scope: ''}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'scope expected');
      t.end();
    });
  });

  test('allowAccess() fails w/ bad callback', function(t) {
    conmock({
      handler: bpc.allowAccess(),
      request: {
        user: fixtures['1-real-user'],
        body: {callback: 'LOL', scope: 'foo_perm'}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'invalid callback: invalid origin protocol');
      t.end();
    });
  });

  test('allowAccess() fails w/ bad scope', function(t) {
    conmock({
      handler: bpc.allowAccess(),
      request: {
        user: fixtures['1-real-user'],
        body: {callback: 'http://foo.org', scope: 'BAD'}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'invalid scope: invalid permission(s): BAD');
      t.end();
    });
  });
  
  test('authorize() fails w/ no token', function(t) {
    conmock({handler: bpc.authorize()}, function(err, mock) {
      t.equal(mock.status, 401);
      t.equal(mock.header('WWW-Authenticate'), 'Bearer realm="test"');
      t.end();
    });
  });

  test('authorize() fails w/ invalid token', function(t) {
    conmock({
      handler: bpc.authorize(),
      request: {
        headers: {
          'authorization': 'Bearer INVALID_ACCESS_TOKEN'
        }
      }
    }, function(err, mock) {
      t.equal(mock.status, 401);
      t.equal(mock.header('WWW-Authenticate'),
              'Bearer realm="test", error="invalid_token", ' +
              'error_description="Unknown access token"');
      t.end();
    });
  });

  test('allowAccess() redirects properly', function(t) {
    conmock({
      handler: bpc.allowAccess(),
      request: {
        user: fixtures['1-real-user'],
        body: {
          callback: 'http://foo.org/callback',
          scope: 'foo_perm'
        }
      }
    }, function(err, mock) {
      var parsed = url.parse(mock.path, true, true);
      if (err) throw err;
      t.equal(mock.status, 303);
      t.equal(mock.fntype, 'redirect');
      t.equal(parsed.protocol, "http:");
      t.equal(parsed.host, "foo.org");
      t.equal(parsed.pathname, "/callback");
      t.same(parsed.query, {
        expires: "1000",
        api_root: "http://backpack.org/test_api",
        access_token: "SOME_UID_1",
        refresh_token: "SOME_UID_2"
      });
      t.end();
    });
  });

  test('authorize() works w/ valid token', function(t) {
    conmock({
      handler: bpc.authorize(),
      request: {
        headers: {
          'authorization': 'Bearer ' + b64enc("SOME_UID_1")
        }
      }
    }, function(err, mock) {
      t.equal(mock.fntype, 'next');
      t.end();
    });
  });

  test('authorize() fails w/ expired token', function(t) {
    nowSecs += 1001;
    conmock({
      handler: bpc.authorize(),
      request: {
        headers: {
          'authorization': 'Bearer ' + b64enc("SOME_UID_1")
        }
      }
    }, function(err, mock) {
      t.equal(mock.status, 401);
      t.equal(mock.header('WWW-Authenticate'),
              'Bearer realm="test", error="invalid_token", ' +
              'error_description="The access token expired"');
      t.end();
    });
  });

  test('refresh() works', function(t) {
    conmock({
      handler: bpc.refresh(),
      request: {
        body: {
          grant_type: "refresh_token",
          refresh_token: "SOME_UID_2"
        }
      }
    }, function(err, mock) {
      t.equal(mock.status, 200);
      t.same(mock.body, {
        expires: 1000,
        access_token: "SOME_UID_3",
        refresh_token: "SOME_UID_4"
      });
      t.end();
    });
  });

  test('authorize() works w/ refreshed token', function(t) {
    conmock({
      handler: bpc.authorize(),
      request: {
        headers: {
          'authorization': 'Bearer ' + b64enc("SOME_UID_3")
        }
      }
    }, function(err, mock) {
      t.equal(mock.fntype, 'next');
      t.equal(mock.request.backpackConnect.get('access_token'), 'SOME_UID_3',
              'request.backpackConnect is set properly');
      t.equal(mock.request.user.get('email'), 'brian@example.org',
              'request.user is set properly');
      t.end();
    });
  });
  
  testUtils.finish(test);
});

