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
