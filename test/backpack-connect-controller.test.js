const url = require('url');

const test = require('tap').test;
const testUtils = require('./');
const conmock = require('./conmock');

const BPCSession = require('../models/backpack-connect').SessionFactory({
  now: function() { return nowSecs * 1000; },
  tokenLifetime: 1000,
  uid: function() { return "SOME_UID_" + (++uid); },
  validPermissions: ["foo_perm", "bar_perm"]
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
  test("revokeOrigin() fails if no user", function(t) {
    conmock({
      handler: bpc.revokeOrigin(),
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 403);
      t.end();
    });
  });

  test("revokeOrigin() fails if no body", function(t) {
    conmock({
      handler: bpc.revokeOrigin(),
      request: {user: {}}
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'body expected');
      t.end();
    });
  });

  test("revokeOrigin() fails if no origin", function(t) {
    conmock({
      handler: bpc.revokeOrigin(),
      request: {user: {}, body: {}}
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'origin URL expected');
      t.end();
    });
  });

  test("Model.revokeOriginForUser() err is handled", function(t) {
    var bpc = new BackpackConnect({
      Model: {
        revokeOriginForUser: function(options, cb) {
          cb(new Error("BLARG ERROR"));
        }
      }
    });
    conmock({
      handler: bpc.revokeOrigin(),
      request: {user: {get: function() {}}, body: {origin: {}}}
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.fntype, "next");
      t.equal(mock.nextErr.message, "BLARG ERROR");
      t.end();
    });
  });

  test("Model.find() err on refresh() is handled", function(t) {
    var bpc = new BackpackConnect({
      Model: {
        find: function(info, cb) { return cb(new Error("FIND ERROR")); }
      }
    });
    conmock({
      handler: bpc.refresh(),
      request: {body: {grant_type: "refresh_token"}}
    }, function(err, mock) {
      t.equal(mock.fntype, "next");
      t.equal(mock.nextErr.message, "FIND ERROR");
      t.end();
    });
  });

  test("session save err on refresh() is handled", function(t) {
    var bpc = new BackpackConnect({
      Model: {
        find: function(info, cb) {
          return cb(null, [{
            refresh: function() {},
            save: function(cb) { cb(new Error("SAVE ERROR")); }
          }]);
        }
      }
    });
    conmock({
      handler: bpc.refresh(),
      request: {body: {grant_type: "refresh_token"}}
    }, function(err, mock) {
      t.equal(mock.fntype, "next");
      t.equal(mock.nextErr.message, "SAVE ERROR");
      t.end();
    });
  });

  test("session save err on allowAccess() is handled", function(t) {
    var FakeModel = function FakeModel() {
      return {
        save: function(cb) { return cb(new Error("SAVE ERROR")); }
      };
    };
    var bpc = new BackpackConnect({Model: FakeModel});
    FakeModel.validators = {origin: function() {}, permissions: function() {}};
    conmock({
      handler: bpc.allowAccess(),
      request: {user: {get: function() {}}, body: {callback: {}, scope: 'lol'}}
    }, function(err, mock) {
      t.equal(mock.fntype, "next");
      t.equal(mock.nextErr.message, "SAVE ERROR");
      t.end();
    });
  });

  test("Model.find() err on authorize() is handled", function(t) {
    var bpc = new BackpackConnect({
      Model: {
        find: function(info, cb) { return cb(new Error("FIND ERROR")); }
      }
    });
    conmock({
      handler: bpc.authorize(),
      request: {headers: {authorization: "Bearer LOL"}}
    }, function(err, mock) {
      t.equal(mock.fntype, "next");
      t.equal(mock.nextErr.message, "FIND ERROR");
      t.end();
    });
  });

  test("User.find() err on authorize() is handled", function(t) {
    var bpc = new BackpackConnect({
      UserModel: {
        find: function(info, cb) { cb(new Error("USER FIND ERROR")); }
      },
      Model: {
        find: function(info, cb) {
          return cb(null, [{
            isExpired: function() { return false; },
            get: function() {}
          }]);
        }
      }
    });
    conmock({
      handler: bpc.authorize(),
      request: {headers: {authorization: "Bearer LOL"}}
    }, function(err, mock) {
      t.equal(mock.fntype, "next");
      t.equal(mock.nextErr.message, "USER FIND ERROR");
      t.end();
    });
  });

  test("User.find() w/ no results is handled", function(t) {
    var bpc = new BackpackConnect({
      UserModel: {
        find: function(info, cb) { cb(null, []); }
      },
      Model: {
        find: function(info, cb) {
          return cb(null, [{
            isExpired: function() { return false; },
            get: function() {}
          }]);
        }
      }
    });
    conmock({
      handler: bpc.authorize(),
      request: {headers: {authorization: "Bearer LOL"}}
    }, function(err, mock) {
      t.equal(mock.fntype, "next");
      t.equal(mock.nextErr.message, "user with id not found");
      t.end();
    });
  });

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

  test('requestAccess() fails w/ empty callback', function(t) {
    conmock({
      handler: bpc.requestAccess(),
      request: {
        query: {callback: ''}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'callback expected');
      t.end();
    });
  });

  test('requestAccess() fails w/ empty scope', function(t) {
    conmock({
      handler: bpc.requestAccess(),
      request: {
        query: {callback: 'http://foo.org', scope: ''}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'scope expected');
      t.end();
    });
  });

  test('requestAccess() fails w/ bad callback', function(t) {
    conmock({
      handler: bpc.requestAccess(),
      request: {
        query: {callback: 'LOL', scope: 'foo_perm'}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.body, 'invalid callback: invalid origin protocol');
      t.end();
    });
  });

  test('requestAccess() fails w/ bad scope', function(t) {
    conmock({
      handler: bpc.requestAccess(),
      request: {
        query: {callback: 'http://foo.org', scope: 'BAD'}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 400);
      t.equal(mock.headers['Content-Type'], 'text/plain');
      t.equal(mock.body, 'invalid scope: invalid permission(s): BAD');
      t.end();
    });
  });
  
  test('requestAccess() works w/ valid args', function(t) {
    conmock({
      handler: bpc.requestAccess(),
      request: {
        query: {
          callback: 'http://foo.org',
          scope: 'foo_perm,bar_perm'
        },
        session: {_csrf: 'a_csrf'}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.fntype, 'render');
      t.equal(mock.path, 'backpack-connect.html');
      t.same(mock.options, {
        clientDomain: "foo.org",
        csrfToken: 'a_csrf',
        joinedScope: "foo_perm,bar_perm",
        scopes: ["foo_perm", "bar_perm"],
        callback: "http://foo.org",
        denyCallback: "http://foo.org/?error=access_denied"
      });
      t.equal(mock.status, 200);
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

  test('authorize(permission) works when perms sufficient', function(t) {
    conmock({
      handler: bpc.authorize("foo_perm"),
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

  test('authorize(permission) fails when perms insufficient', function(t) {
    conmock({
      handler: bpc.authorize("bar_perm"),
      request: {
        headers: {
          'authorization': 'Bearer ' + b64enc("SOME_UID_1")
        }
      }
    }, function(err, mock) {
      t.equal(mock.status, 401);
      t.equal(mock.header('WWW-Authenticate'),
              'Bearer realm="test", error="insufficient_scope", ' +
              'error_description="Scope \'bar_perm\' is required"');
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
  
  test('revokeOrigin() works', function(t) {
    conmock({
      handler: bpc.revokeOrigin(),
      request: {
        user: fixtures['1-real-user'],
        body: {origin: "http://foo.org"}
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.status, 204);
      t.end();
    });
  });

  test('authorize() fails w/ revoked token', function(t) {
    conmock({
      handler: bpc.authorize(),
      request: {
        headers: {
          'authorization': 'Bearer ' + b64enc("SOME_UID_3")
        }
      }
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.fntype, 'send');
      t.equal(mock.status, 401);
      t.end();
    });
  });

  testUtils.finish(test);
});

