const $ = require('./');
const fs = require('fs');
const test = require('tap').test;
const path = require('path')
const backpack = require('../controllers/backpack');
const conmock = require('./conmock');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const User = require('../models/user');

const passport = require('passport');
require('../auth/passport')(passport); // pass passport for configuration

const bcrypt = require('bcrypt-nodejs');

const ASSERTION_NOT_FOUND = path.join(__dirname, 'data' ,'404.png');
const VALID_BAKED_IMAGE = path.join(__dirname, 'data', 'valid-baked.png');
const UNBAKED_IMAGE = path.join(__dirname, 'data', 'unbaked.png');

function hash(thing, salt) {
  return 'sha256$'+require('crypto').createHash('sha256').update(thing).update(salt).digest('hex');
};

const passportReq = require('../node_modules/passport/lib/http/request');
passportReq._passport = {};
passportReq._passport.instance = passport;

$.prepareDatabase({
  '1-user': new User({
    email: $.EMAIL,
    password: bcrypt.hashSync('password', bcrypt.genSaltSync(8), null)
  }),
}, function (fixtures) {

  test('backpack#loginGet', function (t) {
    conmock({
      handler: backpack.login,
      request: {
        csrfToken: function() {
          return 'cats';
        },
      }
    }, function (err, mock) {
      t.same(mock.fntype, 'render', 'should try to render the login page');
      t.same(mock.options['csrfToken'], 'cats', 'should have right csrf token');
      t.end();
    });
  });

  test('backpack#loginPostFail', function (t) {
    conmock({
      handler: passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/backpack/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
      }),
      request: {},
    }, function (err, mock) {
      t.same(mock.path, '/backpack/login', 'no username or password provided... should redirect to the login page');
      t.end();
    });
  });

  passportReq.body = {
    email : $.EMAIL,
    password : "password"
  }

  test('backpack#loginPostPass', function (t) {
    conmock({
      handler: passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/backpack/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
      }),
      request: passportReq,
    }, function (err, mock) {
      t.same(mock.path, '/', 'should redirect to /');
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
      t.equal(req.session, null, 'should wipe out the session');
      t.end();
    });
  });

  // test('backpack#userBadgeUpload: valid baked badge', function (t) {
  //   const assertion = $.makeNewAssertion();
  //   assertion.recipient = {
  //     identity: hash($.EMAIL, 'deadsea'),
  //     salt: 'deadsea',
  //     hashed: true,
  //     type: 'email'
  //   }
  //   $.mockHttp()
  //     .get('/assertion').reply(200, assertion)
  //     .get('/assertion').reply(200, assertion)
  //   conmock({
  //     handler: backpack.userBadgeUpload,
  //     request: {
  //       user: { get: function () { return $.EMAIL } },
  //       files: {
  //         userBadge: {
  //           size: 1,
  //           path: VALID_BAKED_IMAGE,
  //         }
  //       }
  //     }
  //   }, function (err, mock, req) {
  //     t.notOk(mock._error, 'should not have an error');
  //     Badge.findAll(function (err, badges) {
  //       const expectedImageData = fs.readFileSync(VALID_BAKED_IMAGE).toString('base64');
  //       t.same(badges.length, 1);
  //       BadgeImage.findOne({badge_hash: badges[0].get('body_hash')}, function (err, image) {
  //         t.same(image.get('image_data').toString(), expectedImageData);
  //         t.end();
  //       });
  //     })
  //   });
  // });


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

    $.finish(test);
  });

  // test('backpack#settings works', function (t) {
  //   conmock({
  //     handler: backpack.settings({
  //       backpackConnectModel: {
  //         summarizeForUser: function(id, cb) {
  //           t.same(id, 5);
  //           cb(null, [{origin: "http://foo.org", permissions: ["bar"]}]);
  //         }
  //       }
  //     }),
  //     request: {
  //       user: {get: function() { return 5; }},
  //       session: {_csrf: "csrf"}
  //     }
  //   }, function(err, mock) {
  //     t.same(mock.fntype, 'render');
  //     t.same(mock.headers, {
  //       "Cache-Control" : "no-cache, must-revalidate"
  //     });
  //     t.same(mock.options, {
  //       error: undefined,
  //       success: undefined,
  //       csrfToken: "csrf",
  //       services: {},
  //       issuers: [{
  //         origin: "http://foo.org",
  //         domain: "foo.org",
  //         permissions: ["bar"]
  //       }]
  //     });
  //     t.end();
  //   });

  //   $.finish(test);
  // });
});
