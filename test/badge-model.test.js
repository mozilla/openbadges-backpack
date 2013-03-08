const _ = require('underscore');
const test = require('tap').test;
const testUtils = require('./');

const Badge = require('../models/badge');
const User = require('../models/user');

testUtils.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.com'
  }),
  '2-existing-badge': new Badge({
    user_id: 1,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body: testUtils.makeAssertion({recipient: 'brian@example.org'})
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

  test('Badge.validateBody', function (t) {
    const validate = Badge.validateBody;
    const $ = testUtils.makeAssertion;
    const randstr = testUtils.randomstring;

    // Test Helpers
    function hasError(err, field) {
      if (!err) return false;
      if (!err.fields) return false;
      if (!err.fields[field]) return false;
      return true;
    }
    function isMissing(err, field) {
      if (!hasError(err, field)) return false;
      return !!err.fields[field].match(/missing/);
    }
    function isInvalid(err, field) {
      if (!hasError(err, field)) return false;
      return !!err.fields[field].match(/invalid/);
    }
    function isValid(err, field) {
      return !hasError(err, field);
    }
    function getError(field, data) {
      const changes = {};
      changes[field] = data;
      return validate($(changes));
    }
    function testMissing(field) {
      const err = getError(field, null);
      t.ok(isMissing(err, field), 'missing ' + field);
    }
    function testInvalid(field, data) {
      const err = getError(field, data);
      t.ok(isInvalid(err, field), 'invalid ' + field + ': '+ data);
    }
    function testValid(field, data) {
      const err = getError(field, data);
      t.ok(isValid(err, field), 'valid ' + field + ': '+ data);
    }
    function testManyInvalid(field, dataArray) {
      const runTest = testInvalid.bind(null, field);
      dataArray.map(runTest);
    }
    function testManyValid(field, dataArray) {
      const runTest = testValid.bind(null, field);
      dataArray.map(runTest);
    }

    // Valid and invalid data
    const RECIPIENTS = {
      good: ['brian@awesome.com', 'yo+wut@example.com', 'ümlaut@heavymetal.de', 'sha1$c0b19425e0f2c8021ab06c79b19144e127b0f2cb', 'sha256$406f04039d10c79c070b26781e8246dc01ed1d0453c5ad0fa705ff7d507fd898'],
      bad: ['lkajd', 'skj@asdk', '@.com', '909090', '____!@', 'sha1stuff', 'bcrypt$5$something']
    };
    const EMAILS = {
      good: ['brian@awesome.com', 'yo+wut@example.com', 'ümlaut@heavymetal.de'],
      bad: ['lkajd', 'skj@asdk', '@.com', '909090', '____!@', 'sha1stuff']
    };
    const URLS = {
      good: ['http://example.com/', 'https://example.com/w/yo', '/partial/path', '/rad.awesome/great/', '/foreign/crázy/ååú´¨la/'],
      bad: ['-not-asdo', 'ftp://bad-scheme', '@.com:90/', 'just totally wrong']
    };
    const ORIGINS = {
      good: ['http://example.com', 'https://example.com:80', 'https://www.example.com', 'https://www.example.com:8080', 'http://example.com/'],
      bad: ['-not-asdo', 'ftp://bad-scheme', '@.com:90/', 'just totally wrong', 'http://example.com/what', 'http://example.com:8080/false']
    };
    const DATES = {
      good: [Date.now()/1000 | 0, '2012-01-01'],
      bad: ['oiajsd09gjas;oj09', 'foreever ago', '@.com:90/', '2001-10-190-19', '901d1', '000000000000000000000']
    };
    const VERSIONS = {
      good: ['0.1.1', '2.0.1', '1.2.3', 'v1.2.1'],
      bad: ['v100', '50', 'v10.1alpha', '1.2.x']
    };
    const BADGE_NAME_MAXLENGTH = 128;
    const BADGE_DESCRIPTION_MAXLENGTH = 128;
    const ISSUER_NAME_MAXLENGTH = 128;
    const ISSUER_ORG_MAXLENGTH = 128;

    // Required fields
    testMissing('recipient');
    testMissing('badge');
    testMissing('badge.version');
    testMissing('badge.name')
    testMissing('badge.description');
    testMissing('badge.image');
    testMissing('badge.criteria');
    testMissing('badge.issuer');
    testMissing('badge.issuer.origin');
    testMissing('badge.issuer.name');

    // Invalid data
    testManyInvalid('recipient', RECIPIENTS.bad);
    testManyInvalid('evidence', URLS.bad);
    testManyInvalid('expires', DATES.bad);
    testManyInvalid('issued_on', DATES.bad);
    testInvalid('badge.name', randstr(BADGE_NAME_MAXLENGTH + 1));
    testInvalid('badge.description', randstr(BADGE_DESCRIPTION_MAXLENGTH + 1));
    testManyInvalid('badge.image', URLS.bad);
    testManyInvalid('badge.criteria', URLS.bad);
    testManyInvalid('badge.issuer.origin', ORIGINS.bad);
    testInvalid('badge.issuer.name', randstr(ISSUER_NAME_MAXLENGTH + 1));
    testInvalid('badge.issuer.org', randstr(ISSUER_ORG_MAXLENGTH + 1));
    testManyInvalid('badge.issuer.contact', EMAILS.bad);

    // Valid data
    testManyValid('evidence', URLS.good);
    testManyValid('expires', DATES.good);
    testManyValid('issued_on', DATES.good);
    testValid('badge.name', randstr(BADGE_NAME_MAXLENGTH));
    testValid('badge.description', randstr(BADGE_DESCRIPTION_MAXLENGTH));
    testManyValid('badge.image', URLS.good);
    testManyValid('badge.criteria', URLS.good);
    testManyValid('badge.issuer.origin', ORIGINS.good);
    testValid('badge.issuer.name', randstr(ISSUER_NAME_MAXLENGTH));
    testValid('badge.issuer.org', randstr(ISSUER_ORG_MAXLENGTH));
    testManyValid('badge.issuer.contact', EMAILS.good);

    t.same(validate($()), null, 'valid data should be valid');
    t.end();
  });

  test('Badge#save: sets the `body_hash` correctly', function (t) {
    const SHA256_LENGTH = 64;
    const expect = SHA256_LENGTH;
    const assertion = testUtils.makeAssertion({'badge.name': 'Bodyhash Test'});
    const badge = new Badge({
      user_id: 1,
      type: 'hosted',
      endpoint: 'endpoint',
      image_path: 'image_path',
      body: assertion
    });
    badge.save(function (err, result) {
      const hash = badge.get('body_hash');
      t.same(hash.length, expect, 'should get back correct length for body hash');
      t.end();
    });
  });

  test('Badge#validate', function (t) {
    // Test helpers
    function randomAssertion() {
      return testUtils.makeAssertion({
        'badge.name': testUtils.randomstring(128),
        'badge.description': testUtils.randomstring(128),
        'badge.issuer.name': testUtils.randomstring(128),
        'badge.issuer.org': testUtils.randomstring(128),
      })
    }
    function newBadge(modifications) {
      var attrs = _.extend({
        user_id: 1,
        type: 'hosted',
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

    err = validate({type: 'flurgle'});
    t.ok(hasError(err, 'type'), 'should have an error with a bogus type');

    err = validate({type: 'hosted', endpoint: null});
    t.ok(hasError(err, 'type'), 'type error if hosted without endpoint');
    t.ok(hasError(err, 'endpoint'), 'endpoint error if hosted without endpoint');

    err = validate({type: 'signed', jwt: null});
    t.ok(hasError(err, 'type'), 'type error if signed without jwt');
    t.ok(hasError(err, 'jwt'), 'endpoint error if signed without jwt');

    err = validate({type: 'signed', jwt: 'stuff', public_key: null});
    t.ok(hasError(err, 'type'), 'type error if signed without public_key');
    t.ok(hasError(err, 'public_key'), 'public_key error if signed without jwt');

    err = validate({body: null});
    t.ok(hasError(err, 'body'), 'body is required');

    err = validate({body: "Sludge Metal"});
    t.ok(hasError(err, 'body'), 'body error on invalid type');

    err = validate({body: testUtils.makeAssertion({badge: null})});
    t.ok(hasError(err, 'body'), 'body error on invalid assertion');
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

  function hash(algo, string) {
    return (algo+'$'+require('crypto').createHash(algo).update(string).digest('hex'));
  }

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

  test('Badge.confirmRecipient: new assertions should fail at the moment', function (t) {
    const assertion = { recipient: { identity: "brian@mozillafoundation.org" } };
    const expect = false;
    var value;
    try { value = Badge.confirmRecipient(assertion, 'whatever') }
    catch (e) { t.fail('should not have thrown') }
    t.same(value, expect, 'got expected value');
    t.end();
  });

  test('Badge has image url when it comes out of the db', function (t) {
    const expect = fixtures['2-existing-badge'];
    Badge.findById(expect.get('id'), function (err, badge) {
      t.ok(badge.get('imageUrl').match(RegExp(badge.get('body_hash'))), 'image url should match body hash');
      t.end();
    })
  });

  testUtils.finish(test);
});
