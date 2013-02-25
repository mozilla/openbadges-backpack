const test = require('tap').test;
const testUtils = require('./');
const mysql = require('../lib/mysql');
const User = require('../models/user');
const BPCSession = require('../models/backpack-connect').Session;

const FIVE_MINUTES = 1000 * 60 * 5;

testUtils.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.com'
  }),
  '2-session': new BPCSession({
    origin: 'http://foo.org/UNNECCESSARY_PATH',
    permissions: ["foo", "bar"],
    user_id: 1
  })
}, function (fixtures) {
  var session = fixtures['2-session'];

  test("refresh() works", function(t) {
    var i = 0;
    var session = new BPCSession({origin: "http://bar.org"}, {
      tokenLength: 4,
      uid: function(len) { return "UID#" + (++i) + ",length:" + len },
      now: function() { return 5000; }
    });
    
    t.same(session.get('access_token'), undefined,
           'access_token starts unset');
    session.refresh();
    t.same(session.get('access_token'), 'UID#1,length:4');
    t.same(session.get('refresh_token'), 'UID#2,length:4');
    t.same(session.get('access_time'), 5,
           'access_time is in seconds, not ms');
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
    t.equal(session.get('access_token').length, session.tokenLength,
            "access_token is expected length");
    t.equal(session.get('refresh_token').length, session.tokenLength,
            "refresh_token is expected length");
    t.end();
  });

  test('date is valid', function(t) {
    t.ok(session.get('access_time') > ((Date.now() - FIVE_MINUTES) / 1000),
         "access_time is within past five minutes");
    t.end();
  });

  testUtils.finish(test);
});
