const $ = require('./');
const _ = require('underscore');
const test = require('tap').test;

const Badge = require('../models/badge');
const User = require('../models/user');

  function hash(algo, string) {
    console.log(string)
    return (algo+'$'+require('crypto').createHash(algo).update(string).digest('hex'));
  }

$.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.com'
  }),
  '2-existing-badge': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body: $.makeAssertion({recipient: 'brian@example.org'})
  })
}, function (fixtures) {

  test('Badge.findOne', function (t) {
    const expect = fixtures['2-existing-badge'];
    Badge.findOne({user_id: 1}, function (err, badge) {
      t.notOk(err, 'should not have an error');
      t.same(badge.get('id'), expect.get('id'));
      t.end();
    })
  });

  test('Badge#save: sets the `body_hash` correctly', function (t) {
    const SHA256_LENGTH = 64;
    const expect = SHA256_LENGTH;
    const assertion = $.makeAssertion({'badge.name': 'Bodyhash Test'});
    const badge = new Badge({
      user_id: 1,
      endpoint: 'endpoint',
      image_path: 'image_path',
      body: assertion
    });
    badge.save(function (err, result) {
      const hash = badge.get('body_hash');
      t.same(hash.length, expect, 'should get back correct length for body hash');
      t.same(hash, Badge.createHash(assertion));
      t.end();
    });
  });

  test('Badge#validate', function (t) {
    // Test helpers
    function randomAssertion() {
      return $.makeAssertion({
        'badge.name': $.randomstring(128),
        'badge.description': $.randomstring(128),
        'badge.issuer.name': $.randomstring(128),
        'badge.issuer.org': $.randomstring(128),
      })
    }
    function newBadge(modifications) {
      var attrs = _.extend({
        user_id: 1,
        endpoint: 'endpoint',
        image_path: 'image_path',
        body: randomAssertion()
      }, modifications || {})
      return new Badge(attrs);
    }
    function validate(fields) {
      return newBadge(fields).validate();
    }
    function hasError(err, field) {
      if (!err) return false;
      if (!err.fields[field]) return false;
      return true;
    }

    var err;
    t.notOk(newBadge().validate(), 'should have no errors with the defaults');

    err = validate({body: null});
    t.ok(hasError(err, 'body'), 'body is required');

    err = validate({body: "Sludge Metal"});
    t.ok(hasError(err, 'body'), 'body error on invalid type');

    t.end();
  });

  test('Badge.confirmRecipient: regular emails', function (t) {
    var email = 'brian@example.org';
    t.ok(Badge.confirmRecipient({ recipient: email }, email), 'direct valid');

    email = 'brian+something@example.org';
    t.ok(Badge.confirmRecipient({ recipient: email }, email), 'fancy valid');

    t.notOk(Badge.confirmRecipient({ recipient: 'a' }, 'b'), 'false on mismatch');
    t.notOk(Badge.confirmRecipient({ recipient: 'some-email@example.org' }, null), 'should be invalid without email');
    t.notOk(Badge.confirmRecipient({ recipient: 'some-email@example.org' }), 'should be invalid without email');
    t.end();
  });

  test('Badge.confirmRecipient: strange assertions should return false', function (t) {
    t.notOk(Badge.confirmRecipient(['nope']), 'no arrays');
    t.notOk(Badge.confirmRecipient('nope'), 'no strings');
    t.notOk(Badge.confirmRecipient(Math.PI), 'no pi');
    t.notOk(Badge.confirmRecipient(/nope/), 'no regexes');
    t.notOk(Badge.confirmRecipient(function (nope) { return nope }), 'no functions');
    t.end();
  });


  test('Badge.confirmRecipient: hashed recipient', function (t) {
    const email = 'brian@example.org';
    const assertion = { };

    assertion.recipient = hash('sha256', email);
    t.ok(Badge.confirmRecipient(assertion, email), 'hashed email should match');
    t.notOk(Badge.confirmRecipient(assertion, 'incorrect@example.org'), 'no match');

    assertion.recipient = hash('md5', email);
    t.ok(Badge.confirmRecipient(assertion, email), 'hashed email should match');
    t.notOk(Badge.confirmRecipient(assertion, 'incorrect@example.org'), 'no match');

    t.end();
  });

  test('Badge.confirmRecipient: hashed recipient, case-insensitive', function (t) {
    const email = 'brian@example.org';
    const assertion = { };
    assertion.recipient = hash('sha256', email).toUpperCase();
    t.ok(Badge.confirmRecipient(assertion, email), 'hashed email should match');
    t.notOk(Badge.confirmRecipient(assertion, 'incorrect@example.org'), 'no match');

    assertion.recipient = hash('sha256', email).toLowerCase();
    t.ok(Badge.confirmRecipient(assertion, email), 'hashed email should match');
    t.notOk(Badge.confirmRecipient(assertion, 'incorrect@example.org'), 'no match');
    t.end();
  });

  test('Badge.confirmRecipient: bogus algorithm', function (t) {
    const assertion = { recipient: "nope$garbage" };
    const expect = false;
    var value;
    try { value = Badge.confirmRecipient(assertion, 'whatever') }
    catch (e) { t.fail('should not have thrown') }
    t.same(value, expect, 'got expected value');
    t.end();
  });

  test('Badge#stats', function (t) {
    Badge.stats(function(err, data) {
      t.notOk(err, "shouldn't have errors");
      t.equal(data.totalBadges, 2, "count of badges");
      t.equal(data.totalPerIssuer.length, 2, "count of issuers");
    })
    t.end();
  })

  test('Badge.confirmRecipient: new assertions', function (t) {
    const assertion = { recipient: { identity: "brian@mozillafoundation.org" } };
    const expect = true;
    const value = Badge.confirmRecipient(assertion, 'brian@mozillafoundation.org');
    t.same(value, expect, 'got expected value');
    t.end();
  });

  test('Badge.confirmRecipient: new assertions, hashed', function (t) {
    const email = 'brian@example.org';
    const id = hash('sha256', email+'deadsea');
    const assertion = {
      recipient: {
        identity: id,
        salt: 'deadsea',
        hashed: true,
      }
    };
    const expect = true;
    const value = Badge.confirmRecipient(assertion, email);
    t.same(value, expect, 'got expected value');
    t.end();
  });

  test('Badge#getFromAssertion', function (t) {
    const badge = fixtures['2-existing-badge'];
    t.same(badge.getFromAssertion('badge.issuer'), badge.get('body').badge.issuer);
    t.notOk(badge.getFromAssertion('badge.issuer.looooooooooool'), 'should be undefined');
    t.end();
  });

  test('Badge has image url when it comes out of the db', function (t) {
    const expect = fixtures['2-existing-badge'];
    Badge.findById(expect.get('id'), function (err, badge) {
      t.ok(badge.get('imageUrl').match(RegExp(badge.get('body_hash'))), 'image url should match body hash');
      t.end();
    })
  });

  $.finish(test);
});
