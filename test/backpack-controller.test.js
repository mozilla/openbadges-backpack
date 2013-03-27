const $ = require('./');
const fs = require('fs');
const test = require('tap').test;
const backpack = require('../controllers/backpack');
const conmock = require('./conmock');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const User = require('../models/user');

const ASSERTION_NOT_FOUND = __dirname + '/data/404.png';
const VALID_BAKED_IMAGE = __dirname + '/data/valid-baked.png';
const UNBAKED_IMAGE = __dirname + '/data/unbaked.png';

function hash(thing, salt) {
  return 'sha256$'+require('crypto').createHash('sha256').update(thing).update(salt).digest('hex');
};

$.prepareDatabase({
  '1-user': new User({
    email: $.EMAIL
  }),
}, function (fixtures) {

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
        session: { email: $.EMAIL }
      }
    }, function (err, mock, req) {
      t.same(mock.path, '/backpack/login', 'should redirect to the login page');
      t.same(Object.keys(req.session).length, 0, 'should wipe out the session');
      t.end();
    });
  });

  test('backpack#userBadgeUpload: valid baked badge', function (t) {
    const assertion = $.makeNewAssertion();
    assertion.recipient = {
      identity: hash($.EMAIL, 'deadsea'),
      salt: 'deadsea',
      hashed: true,
      type: 'email'
    }
    $.mockHttp()
      .get('/assertion').reply(200, assertion)
      .get('/assertion').reply(200, assertion)
    conmock({
      handler: backpack.userBadgeUpload,
      request: {
        user: { get: function () { return $.EMAIL } },
        files: {
          userBadge: {
            size: 1,
            path: VALID_BAKED_IMAGE,
          }
        }
      }
    }, function (err, mock, req) {
      t.notOk(mock._error, 'should not have an error');
      Badge.findAll(function (err, badges) {
        const expectedImageData = fs.readFileSync(VALID_BAKED_IMAGE).toString('base64');
        t.same(badges.length, 1);
        BadgeImage.findOne({badge_hash: badges[0].get('body_hash')}, function (err, image) {
          t.same(image.get('image_data'), expectedImageData);
          t.end();
        });
      })
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

    $.finish(test);
  });
});

