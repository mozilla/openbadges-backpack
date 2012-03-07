var soda = require('soda'),
    config = require('./local-config').config,
    app = require('../app.js');

app.listen(8888);

var browser = soda.createClient({
    host: config.host
  , port: config.port || 4444
  , url: config.url || 'http://localhost:8888'
  , browser: config.browser || 'firefox'
});

browser.on('command', function(cmd, args){
  console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
});

function scriptify(func) {
  var code = '(' + func.toString() + ')' +
             '(selenium.browserbot.getCurrentWindow());';
  return code;
}

soda.prototype.logIntoBrowserID = function(email, password) {
  return this.waitForPopUp(null, 8000)
    .selectWindow('title=BrowserID')
    .waitForElementPresent('css=input#email')
    .type('css=input#email', email)
    .click('css=button.start')
    .waitForCondition(scriptify(function(window) {
      var active = window.document.activeElement;
      var passwordField = window.document.querySelector("input#password");
      return active === passwordField;
    }), 3000)
    .type('css=input#password', password)
    .click('css=button.returning:enabled')
    .waitForElementPresent('css=button#signInButton')
    .click('css=button#signInButton:enabled');
};

browser
  .chain
  .session()
  .open('/')
  .waitForPageToLoad(8000)
  .click('css=.js-browserid-link')
  .logIntoBrowserID(config.email, config.password)
  .selectWindow('title=Open Badge Backpack')
  .waitForElementPresent('css=div.upload')
  .end(function(err) {
    if (err)
      throw err;
    console.log("Smoke test successful.");
    // TODO: Why doesn't app.close() exit the process?
    process.exit(0);
  });
