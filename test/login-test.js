/*
var mysql = require('../lib/mysql');

var loginUtils = require('./login-utils'),
    assert = require('assert');

var app = loginUtils.startApp();
var suite = loginUtils.suite('login');

suite
  .addBatch({
    'setup': {
      topic: function () {
        mysql.prepareTesting(this.callback);
      }
    }
  }) 
  .discuss('when not logged in')
    .path('/')
      .get().expectRedirectTo('/backpack/login')
    .unpath()
    .path('/backpack/login')
      .get().expect(200).expect('has csrf token', function(err, res, body) {
        var re = /name="_csrf" type="hidden" value="(.*)"/;
        var match = body.match(re);
        assert.equal(match[1], '1234', "csrf exists in HTML");
      })
    .next().unpath()
    .discuss('and using an invalid assertion')
      .postBackpackAuthentication({assertion: 'invalid'})
        .expectRedirectTo('/')
        .next().unpath()
        .path('/backpack/login')
        .get().expect(200).expect('sends a page containing failure text',
          function(err, res, body) {
            assert(body.indexOf('Could not verify with browserID!') > 0);
          })
        .next().unpath().undiscuss()
    .discuss('and using a valid assertion')
      .postBackpackAuthentication()
        .expectRedirectTo('/')
        .expect('sets a session cookie', function(err, res, body) {
          assert.ok('set-cookie' in res.headers);
          var cookie = res.headers['set-cookie'][0];
          assert.equal(cookie.indexOf('openbadges_state'), 0);
        })
      .next().unpath().undiscuss().undiscuss()
  .discuss('when logged in')
    .path('/')
      .get().expect(200)
    .next().unpath()
    .path('/nonexistent')
      .get().expect(404)
    .next().unpath()
    .path('/backpack/signout')
      .get()
      .expectRedirectTo('/backpack/login')
    .next().undiscuss().unpath()
  .discuss('after logging out')
    .path('/')
      .get().expectRedirectTo('/backpack/login')
    .next().undiscuss().unpath()
  .discuss('when logged out and accepting json')
    .setHeader('accept', 'application/json')
    .discuss('and using an invalid assertion')
      .postBackpackAuthentication({assertion: 'invalid'})
        .expect(400)
        .expect({status: 'error',
                 reason: 'browserID verification failed: invalid assertion'})
        .undiscuss()
    .discuss('and not sending an assertion')
      .postFormData()
        .expect(400)
        .expect({status: 'error', reason: 'assertion expected'})
        .next().unpath().undiscuss()
    .discuss('and using a valid assertion')
      .postBackpackAuthentication()
        .expect(200)
        .expect({status: 'ok', email: loginUtils.FAKE_EMAIL})

suite.export(module);
*/