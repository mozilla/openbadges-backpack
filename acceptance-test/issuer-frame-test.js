require('./acceptance-test-utils.js').createClient({
  extensions: {
    waitForBadgePrompt: function(img, action) {
      var imgLocator = 'css=#badge-ask img[src="/_demo/' + img + '"]';
      return this.waitForVisible(imgLocator)
                 .click("css=#badge-ask button." + action);
    }
  }
}).chain
  .session()
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Log in as a different user and make backpack explode.
    .click("css=#welcome button.logout")
    .waitForBadgePrompt("nc.large.png", "accept")
    .waitForVisibleContent({
      selector: '#messages div.alert.alert-error',
      content: "An error occurred when trying to add the " +
               "<em>HTML9 Fundamental</em> badge to your backpack."
    })
    .waitForVisible("css=#farewell h3.badges-0")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Accept 2 badges
    .click("css=#welcome button.next.btn.btn-primary")
    .waitForBadgePrompt("cc.large.png", "accept")
    .waitForBadgePrompt("by.large.png", "accept")
    .waitForVisible("css=#farewell h3.badges-many")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Accept 1 badge, reject 1
    .click("css=#welcome button.next.btn.btn-primary")
    .waitForBadgePrompt("cc.large.png", "reject")
    .waitForBadgePrompt("by.large.png", "accept")
    .waitForVisible("css=#farewell h3.badges-1")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Reject 2 badges
    .click("css=#welcome button.next.btn.btn-primary")
    .waitForBadgePrompt("cc.large.png", "reject")
    .waitForBadgePrompt("by.large.png", "reject")
    .waitForVisible("css=#farewell h3.badges-0")
    .click("css=#farewell button.next")
  .gracefulExit();
