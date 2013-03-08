const $ = require('./');
const fs = require('fs');
const test = require('tap').test;
const backpack = require('../controllers/backpack');
const conmock = require('./conmock');
const Badge = require('../models/badge');
const User = require('../models/user');

const ASSERTION_NOT_FOUND = __dirname + '/data/404.png';
const VALID_BAKED_IMAGE = __dirname + '/data/valid-baked.png';
const UNBAKED_IMAGE = __dirname + '/data/unbaked.png';

function hash(thing, salt) {
  return 'sha256$'+require('crypto').createHash('sha256').update(thing).update(salt).digest('hex');
};

$.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.com'
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
        session: { email: 'brian@example.org' }
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
        if (badges.length)
          t.same(badges[0].get('image_data'), expectedImageData);
        t.end();
      })
    });
  });


  test('backpack#manage', function (t) {
    // #TODO: re-write after making backpack.manage sane.
    t.end();
  });


  $.finish(test);
});

