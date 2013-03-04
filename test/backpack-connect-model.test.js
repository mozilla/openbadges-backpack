const test = require('tap').test;
const testUtils = require('./');
const mysql = require('../lib/mysql');
const User = require('../models/user');
const BPC = require('../models/backpack-connect');
const BPCSession = BPC.SessionFactory({
  validPermissions: ["foo", "bar", "baz"]
});

const FIVE_MINUTES = 1000 * 60 * 5;

testUtils.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.com'
  }),
  '2-user': new User({
    email: 'bob@example.com'
  }),
  '2-session': new BPCSession({
    origin: 'http://foo.org/UNNECCESSARY_PATH',
    permissions: ["foo", "bar"],
    user_id: 1
  }),
  '3-session': new BPCSession({
    origin: 'http://foo.org',
    permissions: ["foo", "baz"],
    user_id: 1
  }),
  '4-session': new BPCSession({
    origin: 'http://foo2.org',
    permissions: ["bar"],
    user_id: 1
  }),
  '5-session': new BPCSession({
    origin: 'http://foo.org',
    permissions: ["foo"],
    user_id: 2
  }),
}, function (fixtures) {
  var session = fixtures['2-session'];

  test("refresh() and isExpired() work", function(t) {
    var i = 0;
    var now = 5000;
    var BPCSession = new BPC.SessionFactory({
      tokenLength: 4,
      tokenLifetime: 5,
      uid: function(len) { return "UID#" + (++i) + ",length:" + len },
      now: function() { return now; }
    });
    var session = new BPCSession({origin: "http://bar.org"});
    
    t.same(session.get('access_token'), undefined,
           'access_token starts unset');
    session.refresh();
    t.same(session.get('access_token'), 'UID#1,length:4');
    t.same(session.get('refresh_token'), 'UID#2,length:4');
    t.same(session.get('access_time'), 5,
           'access_time is in seconds, not ms');
    t.ok(!session.isExpired(), 'new token is not expired');
    now += 6000;
    t.ok(session.isExpired(), 'token is expired once time has elapsed');
    t.end();
  });
  
  test('permissions validator works', function(t) {
    t.equal(BPCSession.validators.permissions(["foo", "bar"]), undefined);
    t.equal(BPCSession.validators.permissions(["a", "b"]),
            "invalid permission(s): a, b");
    t.end();
  });
  
  test('origin validator works', function(t) {
    t.equal(BPCSession.validators.origin("http://blah.org"), undefined);
    t.equal(BPCSession.validators.origin("https://blah.org"), undefined);
    t.equal(BPCSession.validators.origin("mailto:lol@u.org"),
            "invalid origin protocol");
    t.equal(BPCSession.validators.origin("https://"), "invalid origin host");
    t.end();
  });
  
  test('path is removed from origin if needed', function(t) {
    t.same(session.get('origin'), 'http://foo.org');
    t.end();
  });

  test('find() works', function(t) {
    BPCSession.find({id: 1}, function(err, result) {
      if (err) throw err;
      t.same(result[0].attributes, session.attributes,
             "retrieving from db results in same attributes as original");
      t.end();
    });
  });
  
  test('permissions are valid', function(t) {
    t.same(session.get('permissions'), ['foo', 'bar'],
           "permissions are accessible as array");

    var query = "SELECT permissions FROM `bpc_session` WHERE `id` = 1";
    mysql.client.query(query, function(err, results) {
      if (err) throw err;
      t.same(results, [{permissions: "foo,bar"}],
             "permissions are stored in db as comma-separated values");
      t.end();
    });
  });
  
  test('token lengths are valid', function(t) {
    function len(token) {
      return new Buffer(token.split('_')[0], 'base64').length;
    }
    
    t.equal(len(session.get('access_token')), session.tokenLength,
            "access_token is expected length");
    t.equal(len(session.get('refresh_token')), session.tokenLength,
            "refresh_token is expected length");
    t.end();
  });

  test('date is valid', function(t) {
    t.ok(session.get('access_time') > ((Date.now() - FIVE_MINUTES) / 1000),
         "access_time is within past five minutes");
    t.end();
  });

  test('hasPermission() works', function(t) {
    t.same(session.hasPermission('foo'), true);
    t.same(session.hasPermission('blogh'), false);
    t.same(session.hasPermission('bar'), true);
    t.end();
  });
  
  test('summarizeForUser() works', function(t) {
    BPCSession.summarizeForUser(1, function(err, results) {
      if (err) throw err;
      t.same(results, [{
        origin: "http://foo.org",
        permissions: ["bar", "baz", "foo"]
      }, {
        origin: "http://foo2.org",
        permissions: ["bar"]
      }]);
      t.end();
    });
  });

  test('revokeOriginForUser() works', function(t) {
    BPCSession.revokeOriginForUser({
      origin: "http://foo.org",
      user_id: 1
    }, function(err) {
      if (err) throw err;
      BPCSession.find({origin: "http://foo.org"}, function(err, results) {
        if (err) throw err;
        t.equal(results.length, 1);
        t.equal(results[0].get('user_id'), 2);
        t.end();
      });
    });
  });

  testUtils.finish(test);
});
