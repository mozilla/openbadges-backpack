var _ = require('underscore')
  , app = require('../app.js')
  , vows = require('vows')
  , assert = require('assert')
  , should = require('should')
  , mysql = require('../lib/mysql.js')
  , map = require('functools').map
  , utils = require('./utils')
  , request = utils.conn.request
  , response = utils.conn.response

function makeHash (email, salt) {
  var sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

var user, anotherUser, badge, hashedBadge, group;
function setupDatabase (callback) {
  var User = require('../models/user.js')
  var Badge = require('../models/badge.js')
  var Group = require('../models/group.js')
  var fixture = require('../lib/utils').fixture;
  function saver (m, cb) { m.save(cb) };
  mysql.prepareTesting(function() {
    user = new User({ email: 'brian@example.com' });
    anotherUser = new User({ email: 'someoneelse@example.com' });
    badge = new Badge({
      user_id: 1,
      type: 'hosted',
      endpoint: 'endpoint',
      image_path: 'image_path',
      body_hash: 'body_hash',
      body: fixture({recipient: 'brian@example.com'})
    });
    hashedBadge = new Badge({
      user_id: 2,
      type: 'hosted',
      endpoint: 'endpoint',
      image_path: 'image_path',
      body_hash: 'body_hash',
      body: fixture({recipient: makeHash('brian@example.com', 'hashbrowns')})
    });
    group = new Group({
      user_id: 1,
      name: 'name',
      url: 'url',
      'public': 1,
      badges: [1]
    });
    map.async(saver, [user, anotherUser, badge, hashedBadge, group], callback);
  });
}

var backpack = require('../controllers/backpack.js')
vows.describe('basic login controller test').addBatch({
  'setup' : {
    topic: function () {
      setupDatabase(this.callback);
    },
    '#login' : {
      topic: function () {
        var req = request();
        backpack.login(req, response(req, this.callback))
      },
      'tries to render login page and passes csrf' : function (conn, render, opts) {
        render.should.equal('login');
        opts.csrfToken.should.equal('default-csrf');
      },
    },
    '#signout' : {
      topic: function () {
        var req = request();
        backpack.signout(req, response(req, this.callback))
      },
      'deletes session and redirects to login with 303' : function (conn, path, status) {
       path.should.equal('/backpack/login');
       status.should.equal(303);
       _.keys(conn.request.session).length.should.equal(0);
      }
    },
    '#manage' : {
      topic: function () {
        var req = request({ user: user });
        backpack.manage(req, response(req, this.callback))
      },
      'should pull badges and groups, render `backpack`' : function (conn, render, opts) {
        render.should.equal('backpack');
        opts.badges.should.have.lengthOf(1);
        opts.badges[0].serializedAttributes.should.match(/"recipient":"brian@example.com"/)
        opts.groups.should.have.lengthOf(1);
        opts.groups[0].attributes.name.should.equal('name');
      }
    },
    '#manage for hashed badge recipient' : {
      topic: function () {
        var req = request({ user: anotherUser });
        backpack.manage(req, response(req, this.callback))
      },
      'should replace hashed recipient with user email' : function (conn, render, opts) {
        opts.badges.should.have.lengthOf(1);
        opts.badges[0].serializedAttributes.should.match(/"recipient":"someoneelse@example.com"/)
      }
    }
  }
}).export(module);