var vows = require('vows')
  , app = require('../app.js')
  , assert = require('assert')
  , should = require('should')
  , issuer = require('../controllers/issuer.js')
  , conmock = require('./conmock.js')
  , _ = require('underscore')
  , utils = require('./utils')
  , request = utils.conn.request
  , response = utils.conn.response
  , mysql = require('../lib/mysql.js')
  , map = require('functools').map

var newUser, oldUser, badge;
function setupDatabase (callback) {
  var User = require('../models/user.js');
  var Badge = require('../models/badge.js')
  mysql.prepareTesting();
  function saver (m, cb) { m.save(cb) };
  newUser = new User({ email: 'new@example.com' });
  oldUser = new User({ email: 'old@example.com' });
  var badgedata = require('../lib/utils').fixture({recipient: 'old@example.com'})
  badge = new Badge({
    user_id: 2,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: badgedata
  });
  map.async(saver, [newUser, oldUser, badge], callback);
}

vows.describe('issuer controller test').addBatch({
  'Issuer Controller': {
    '#validator': {
      
      'when client sends no data' : {
        'and header "Accept: */*"' : {
          topic: function () {
            var req = { headers: {accept: '*/*'} };
            conmock(issuer.validator, req, this.callback);
          },
          'renders validator html without options' : function (err, mock) {
            mock.fntype.should.equal('render');
            mock.path.should.equal('validator');
          },
        },
        'and "Accept: text/html"' : {
          topic: function () {
            var req = { headers: {accept: 'text/html'} };
            conmock(issuer.validator, req, this.callback);
          },
          'renders validator html without options' : function (err, mock) {
            mock.fntype.should.equal('render');
            mock.path.should.equal('validator');
          },
        },
        'and "Accept: text/plain"' : {
          topic: function () {
            var req = { headers: {accept: 'text/plain'} };
            conmock(issuer.validator, req, this.callback);
          },
          'sends back plain text' : function (err, mock) {
            mock.headers['Content-Type'].should.equal('text/plain');
          },
          'status 400' : function (err, mock) {
            mock.status.should.equal(400);
          },
          'body has word "data" in it' : function (err, mock) {
            mock.body.should.match(/data/);
          },
        },
        'and "Accept: application/json"' : {
          topic: function () {
            var req = { headers: {accept: 'application/json'} };
            conmock(issuer.validator, req, this.callback);
          },
          'sends back json' : function (err, mock) {
            mock.headers['Content-Type'].should.equal('application/json');
          },
          'status 400' : function (err, mock) {
            mock.status.should.equal(400);
          },
          'message has word "error" in it' : function (err, mock) {
            mock.body.status.should.match(/error/);
          },
        },
      },
      
      
      'when client sends an empty data set' : {
        topic: function () { return function () { return { body: { assertion : '{}' }, headers: {} } } },
        'and header "Accept: */*"' : {
          topic: function (req) {
            req = req();
            req.headers.accept = '*/*';
            conmock(issuer.validator, req, this.callback);
          },
          'renders validator html with some options' : function (err, mock) {
            mock.fntype.should.equal('render');
            mock.path.should.equal('validator');
            var errors = _.pluck(mock.options.errors, 'field');
            assert.include(errors, 'recipient');
            assert.include(errors, 'badge.version');
            assert.include(errors, 'badge.name');
            assert.include(errors, 'badge.image');
            assert.include(errors, 'badge.description');
            assert.include(errors, 'badge.criteria');
            assert.include(errors, 'badge.issuer.origin');
            assert.include(errors, 'badge.issuer.name');
          },
        },
        'and "Accept: application/json"' : {
          topic: function (req) {
            req = req();
            req.headers.accept = 'application/json';
            conmock(issuer.validator, req, this.callback);
          },
          'sends back json with a bunch of errors' : function (err, mock) {
            mock.status.should.equal(400);
            var errors = _.pluck(mock.body.errors, 'field');
            assert.include(errors, 'recipient');
            assert.include(errors, 'badge.version');
            assert.include(errors, 'badge.name');
            assert.include(errors, 'badge.image');
            assert.include(errors, 'badge.description');
            assert.include(errors, 'badge.criteria');
            assert.include(errors, 'badge.issuer.origin');
            assert.include(errors, 'badge.issuer.name');
          },
        },
        'and "Accept: text/plain"' : {
          topic: function (req) {
            req = req();
            req.headers.accept = 'text/plain';
            conmock(issuer.validator, req, this.callback);
          },
          'sends back text with a bunch of errors' : function (err, mock) {
            mock.body.split('\n').length.should.equal(8);
          },
        },
      },
    },
    '#welcome': {
      'with no user logged in': {
        topic: function () {
          var req = request();
          issuer.welcome(req, response(req, this.callback))
        },
        'redirects to login': function (conn, path, status) {
          path.should.equal('/backpack/login');
          status.should.equal(303);
        }
      },
      'with logged in user': {
        topic: function () {
          setupDatabase(this.callback);
        },
        'that has no badges yet': {
          topic: function () {
            var req = request({ user: newUser });
            issuer.welcome(req, response(req, this.callback))
          },
          'renders new user welcome': function (conn, render, opts) {
            render.should.equal('issuer-welcome');
          }
        },
        'that has badges already': {
          topic: function () {
            var req = request({ user: oldUser });
            issuer.welcome(req, response(req, this.callback))
          },
          'redirects to backpack': function (conn, path, status) {
            path.should.equal('/');
            status.should.equal(303);
          }
        },
      }
    },
    '#frame': {
      topic: function () {
        conmock(issuer.frame, {}, this.callback);
      },
      'renders issuer frame with framed option' : function (err, mock) {
        mock.fntype.should.equal('render');
        mock.path.should.equal('badge-accept');
        mock.options.framed.should.be.true;
      },
    },
    '#frameless': {
      'without assertions': {
        topic: function () {
          var req = { body: { assertions: [] } };
          conmock(issuer.frameless, req, this.callback);
        },
        'renders issuer frame with unframed option' : function (err, mock) {
          mock.fntype.should.equal('render');
          mock.path.should.equal('badge-accept');
          mock.options.framed.should.not.be.true;
          mock.options.assertions.should.equal('[]');
        },
      },
      'with one good assertion': {
        topic: function () {
          var req = { body: { assertions: 'http://something.com/good' } };
          conmock(issuer.frameless, req, this.callback);
        },
        'renders issuer frame with unframed option' : function (err, mock) {
          mock.fntype.should.equal('render');
          mock.path.should.equal('badge-accept');
          mock.options.framed.should.not.be.true;
        },
        'assertion is stringified in assertions option': function (err, mock) {
          mock.options.assertions.should.equal('["http://something.com/good"]');
        },
      },
      'with many good assertions': {
        topic: function () {
          var req = { body: { assertions: ['http://something.com/good/1', 'http://something.com/good/2'] } };
          conmock(issuer.frameless, req, this.callback);
        },
        'renders issuer frame with unframed option' : function (err, mock) {
          mock.fntype.should.equal('render');
          mock.path.should.equal('badge-accept');
          mock.options.framed.should.not.be.true;
        },
        'assertions are stringified in assertions option': function (err, mock) {
          mock.options.assertions.should.equal('["http://something.com/good/1","http://something.com/good/2"]');
        },
      },
      'with bad assertion': {
        topic: function () {
          var req = { body: { assertions: ['bad!', 'http://something.com/good/2'] } };
          conmock(issuer.frameless, req, this.callback);
        },
        'sends back 400 error' : function (err, mock) {
          mock.fntype.should.equal('send');
          mock.status.should.equal(400);
          mock.body.should.equal('malformed url');
        },
      }
    }
  },
}).export(module)