var config = require('./local-config').config,
    utils = require('./acceptance-test-utils.js');

utils.createClient({
  extensions: {
    logIntoBrowserID: function(email, password) {
      return this.waitForPopUp(null, 8000)
        .selectWindow('title=BrowserID')
        .waitForElementPresent('css=input#email')
        .type('css=input#email', email)
        .click('css=button.start')
        .waitForCondition(utils.scriptify(function(window) {
          var active = window.document.activeElement;
          var passwordField = window.document.querySelector("input#password");
          return active === passwordField;
        }), 3000)
        .type('css=input#password', password)
        .click('css=button.returning:enabled');
    }
  }
}).chain
  .session()
  .open('/')
  .waitForPageToLoad(8000)
  .click('css=.js-browserid-link')
  .logIntoBrowserID(config.email, config.password)
  .selectWindow('title=Mozilla Backpack')
  .waitForElementPresent('css=div.upload')
  .gracefulExit();
