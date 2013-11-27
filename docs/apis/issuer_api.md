# Issuer API

Technical Documentation below. Want to take a step back? Check out the [Issuer Onboarding Docs](https://wiki.mozilla.org/Badges/Onboarding-Issuer).

The Issuer API is a script that can be dropped-in to any badge issuer's website to provide a way for users to add an issuer's badges to their backpack. It's a lightweight alternative to the [Backpack Connect API](https://github.com/mozilla/openbadges/wiki/Backpack-Connect:-Issuer-Documentation).

There's no need to bake the badges yourself.  The API takes care of it for you.  The badge creation workflow is simple!

 1. Create and host an assertion on your site
 2. Create and host the badge PNG, this is a single PNG for all badges, not a single physical PNG per issued badge.
 3. Integrate your site with the backpack via the Issuer API!
 4. High five yourself, you're issuing badges!

![Liz](http://i705.photobucket.com/albums/ww53/essie_bucket/funny-gif-self-high-five-Liz-Lemon.gif)

Check out the following resources:
* [Badge tutorial](https://badgelab.herokuapp.com/) by Atul Varma
* [Earn a Badge Issue a badge](http://weblog.lonelylion.com/2012/03/22/earn-a-badge-issue-a-badge/) by Chris McAvoy to help you get started on issuing badges with the Issuer API


## Methods

The Issuer API provides the following methods.

`OpenBadges.issue(assertions, *callback*)`

Presents the user with a modal dialog that requests their consent to add the issuer's badge(s) to their backpack. If the user is not currently logged into the backpack, they will first be asked to log in or create an account if necessary.

This method will behave like `OpenBadges.issue_no_modal(assertions)` described below for some browsers.

* *assertions* is a list of URLs or JSON Web Signatures that represent [badge assertions](https://github.com/mozilla/openbadges-specification/blob/master/Assertion/latest.md).
 * [assertion validator](http://validator.openbadges.org/)
* *callback* is a function that **may** be called when the user has completed their interaction with the modal dialog. The function is passed two positional arguments:
    * *errors* is a list of objects that provide information about any assertions that weren't able to be added to the user's backpack. Each object contains the following keys:
        * *url* is the URL of the assertion that couldn't be added to the user's backpack.
        * *reason* is an **Error Constant String** identifying the reason the assertion couldn't be added to the user's backpack.
    * *successes* is a list of badge assertions that were successfully added to the user's backpack.

`OpenBadges.issue_no_modal(assertions)`

Redirects the page to a full-window version of the modal dialog described above. While this does not allow the invocation of a callback with the results of the interaction, it is generally more compatible with older browsers.

* *assertions* is a list of URLs or JSON Web Signatures that represent [badge assertions](https://github.com/mozilla/openbadges-specification/blob/master/Assertion/latest.md).



## Error Constant Strings

* `DENIED` means that the user explicitly denied the badge from being added to their backpack.

* `EXISTS` means that the badge is already in the user's backpack.

* `INACCESSIBLE` means that the assertion URL provided could not be retrieved. For instance, the assertion URL itself may be malformed, or attempting to access the assertion may have resulted in 404 Not Found or 403 Forbidden.

* `MALFORMED` means that the assertion URL provided exists but was malformed.

* `INVALID` means that the assertion URL provided exists and is well-formed, but is not valid. For instance, the recipient of the assertion may not be the currently logged-in user.

## Using the API

The Mozilla Open Badges hosted issuer API is easy to integrate into your projects, making it possible to easily push badges from your system into the Mozilla hosted Backpack.  Start by including the API Javascript:

    <script src="https://backpack.openbadges.org/issuer.js"></script>

either in the head of your application, or before you make any API calls. Once you've included the API, you'll have access to the <code>OpenBadges.issue</code> function.  The function takes two arguments, an array of url's which each represent a hosted assertion, and a callback function that is called on completion of the dialogue with the user.

An example usage of the API:

<code>OpenBadges.issue([url1, url2], function(errors, successes) { //do something });</code>

When OpenBadges.issue is called, the user is presented with a lightboxed dialogue that allows them to accept the badges, which will then be included in their Mozilla hosted backpack.

Make sure your assertion url can respond using both HTTP GET and HEAD.

## Threat Model

The reason we're even presenting the user with a dialog is because we want to prevent badge spamming, whereby third-party issuers spam a user's backpack with badges that they don't want. Consequently, we need the backpack to ask for the user's consent. This will be accomplished via an iframe embedded in the issuer's page.

The only sensitive information that a user needs to enter in this flow is login credentials. Since authentication is done via [BrowserID](https://browserid.org/), which opens in a pop-up window, the consequences of spoof attacks are minimal–so long as the user knows to look at domain names in their address bar and BrowserID's UI.
