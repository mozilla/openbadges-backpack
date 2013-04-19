process.env['BROWSERID_TEST_USER'] = 'foo@bar.org';

var async = require('async');
var acceptanceTest = require('./acceptance-test-utils.js').test;

acceptanceTest('Login works', function(t) {
  async.series([
    t.open('/'),
    t.click('.js-browserid-link'),
    t.waitForVisibleContent({
      selector: 'li.user.navbar-text',
      content: 'foo@bar.org'
    })
  ], t.end);
});
