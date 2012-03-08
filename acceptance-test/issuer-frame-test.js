var soda = require('soda'),
    utils = require('./acceptance-test-utils.js');

soda.prototype.waitForBadgePrompt = function(img, action) {
  return this.waitForVisible('css=#badge-ask img[src="/_demo/' + img + '"]')
             .click("css=#badge-ask button." + action);
};

soda.prototype.waitForVisibleContent = function(args) {
  var hasContent = utils.scriptify(function(window, args) {
    function collapseWhitespace(text) {
      return text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    }
    
    var element = window.document.querySelector(args.selector);
    var html = element && collapseWhitespace(element.innerHTML);
    if (!html)
      return false;
    return html.indexOf(collapseWhitespace(args.content)) != -1;
  }, args);

  return this.waitForVisible("css=" + args.selector)
             .waitForCondition(hasContent, 4000);
};

utils.createClient()
  .chain
  .session()
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Log in as a different user and make backpack explode.
    .click("css=#welcome button.logout")
    .waitForBadgePrompt("nc.large.png", "accept")
    .waitForVisibleContent({
      selector: '#messages div.alert-message.danger',
      content: "An error occurred when trying to add the " +
               "<em>HTML9 Fundamental</em> badge to your backpack."
    })
    .waitForVisible("css=#farewell h3.badges-0")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Accept 2 badges
    .click("css=#welcome button.next.btn.primary")
    .waitForBadgePrompt("cc.large.png", "accept")
    .waitForBadgePrompt("by.large.png", "accept")
    .waitForVisible("css=#farewell h3.badges-many")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Accept 1 badge, reject 1
    .click("css=#welcome button.next.btn.primary")
    .waitForBadgePrompt("cc.large.png", "reject")
    .waitForBadgePrompt("by.large.png", "accept")
    .waitForVisible("css=#farewell h3.badges-1")
    .click("css=#farewell button.next")
  .open('/issuer/frame').waitForPageToLoad(8000)
    // Reject 2 badges
    .click("css=#welcome button.next.btn.primary")
    .waitForBadgePrompt("cc.large.png", "reject")
    .waitForBadgePrompt("by.large.png", "reject")
    .waitForVisible("css=#farewell h3.badges-0")
    .click("css=#farewell button.next")
  .end(function(err) {
    if (err)
      throw err;
    console.log("Issuer frame test successful.");
    // TODO: Why doesn't app.close() exit the process?
    process.exit(0);
  });
