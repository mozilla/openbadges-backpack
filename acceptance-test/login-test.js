process.env['BROWSERID_TEST_USER'] = 'foo@bar.org';

var config = require('./local-config').config,
    utils = require('./acceptance-test-utils.js');

utils.createClient().chain
  .session()
  .open('/')
  .waitForPageToLoad(8000)
  .click('css=.js-browserid-link')
  .selectWindow('title=Mozilla Backpack')
  .waitForVisibleContent({
    selector: 'li.user.navbar-text',
    content: 'foo@bar.org'
  })
  .gracefulExit();
