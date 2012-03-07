var soda = require('soda'),
    config = require('./local-config').config,
    app = require('../app.js');

app.listen(8888);

var browser = soda.createClient({
    host: config.host
  , port: config.port || 4444
  , url: config.url || 'http://localhost:8888/'
  , browser: config.browser || 'firefox'
});

browser.on('command', function(cmd, args){
  console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
});

browser
  .chain
  .session()
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Log in as a different user and make backpack explode.
    .click("css=#welcome button.logout")
    .waitForVisible('css=#badge-ask img[src="/_demo/nc.large.png"]')
    .click("css=#badge-ask button.accept")
    .waitForVisible('css=#messages div.alert-message.danger')
    .waitForVisible("css=#farewell h3.badges-0")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Accept 2 badges
    .click("css=#welcome button.next.btn.primary")
    .waitForVisible('css=#badge-ask img[src="/_demo/cc.large.png"]')
    .click("css=#badge-ask button.accept")
    .waitForVisible('css=#badge-ask img[src="/_demo/by.large.png"]')
    .click("css=#badge-ask button.accept")
    .waitForVisible("css=#farewell h3.badges-many")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Accept 1 badge, reject 1
    .click("css=#welcome button.next.btn.primary")
    .waitForVisible('css=#badge-ask img[src="/_demo/cc.large.png"]')
    .click("css=#badge-ask button.reject")
    .waitForVisible('css=#badge-ask img[src="/_demo/by.large.png"]')
    .click("css=#badge-ask button.accept")
    .waitForVisible("css=#farewell h3.badges-1")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Reject 2 badges
    .click("css=#welcome button.next.btn.primary")
    .waitForVisible('css=#badge-ask img[src="/_demo/cc.large.png"]')
    .click("css=#badge-ask button.reject")
    .waitForVisible('css=#badge-ask img[src="/_demo/by.large.png"]')
    .click("css=#badge-ask button.reject")
    .waitForVisible("css=#farewell h3.badges-0")
    .click("css=#farewell button.next")
  .end(function(err) {
    if (err)
      throw err;
    console.log("Issuer frame test successful.");
    // TODO: Why doesn't app.close() exit the process?
    process.exit(0);
  });
