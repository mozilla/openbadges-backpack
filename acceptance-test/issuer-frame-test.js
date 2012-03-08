require('./acceptance-test-utils.js').createClient()
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
