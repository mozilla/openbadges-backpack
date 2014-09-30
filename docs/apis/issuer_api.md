# Mozilla Hosted Backpack - Issuer API

This document regards the Issuer API for pushing earner badges to the Mozilla Backpack. In order to use the Issuer API, you first need to have your badge assertions(s) prepared. If you're new to badge issuing or assertions, see these pages:

* [Issuer Onboarding](https://github.com/mozilla/openbadges/wiki/Open-Badges-Onboarding:-Issuers)
* [Assertion Information for the Uninitiated](https://github.com/mozilla/openbadges/wiki/Assertion-Information-for-the-Uninitiated)
* [Assertion Specification](https://github.com/mozilla/openbadges-specification/blob/master/Assertion/latest.md)
* [New Issuers: Give Yourself a Badge](https://github.com/mozilla/openbadges/wiki/New-Issuers:-Give-Yourself-a-Badge)
* [Issuer Checklist](https://github.com/mozilla/openbadges/wiki/Issuer-Checklist)
* [Badge tutorial](https://badgelab.herokuapp.com/)
* [Earn a Badge Issue a badge](http://weblog.lonelylion.com/2012/03/22/earn-a-badge-issue-a-badge/)
* [Assertion Validator](http://validator.openbadges.org/)

For a technical overview of the Issuer API, read on. For a step-by-step tutorial on using the API, see [Using the Issuer API](https://github.com/mozilla/openbadges/wiki/Using-the-Issuer-API).

## Overview

The Issuer API is a script that can be dropped into any badge issuer's website to provide a way for users to add an issuer's badges to their Backpack. It's a lightweight alternative to the [Backpack Connect API](backpack_connect.md). With the Issuer API, you need the earner's permission each time you push to the Backpack - with the Connect alternative, you can manage user permission on an ongoing basis.

A baked badge is a badge image with the assertion metadata embedded into it. When you use the Issuer API, you do not need to bake your badges, as the API handles this automatically.

The badge creation workflow is as follows:

 1. Create and host a badge assertion on your site.*
 2. Create and host the badge PNG (_this is a single PNG for all badges, not a single physical PNG per issued badge_).
 3. Integrate your site with the Backpack via the Issuer API.

*A badge assertion represents a single badge awarded to a single earner. Each assertion includes the earner identity and a link to info about the badge itself, which in turn links to information about the issuer. The Issuer API can handle both __hosted__ and __signed__ badge assertions. A _hosted_ assertion requires three JSON files hosted at stable URLs. A _signed_ assertion requires a JSON Web Signature.

__Your assertion URLs should respond using both HTTP `GET` and `HEAD`.__

## Installation

To access the Issuer API, include a link to the script in your site as follows:

```html
<script src="https://backpack.openbadges.org/issuer.js"></script>
```

You can then access the API methods using the `OpenBadges` object.

## Methods

The Issuer API provides the following methods: [`issue`](#issueassertions-callback) and [`issue_no_modal`](#issue_no_modalassertions).

### `issue(assertions, callback)`

Presents the user with a modal dialog that requests their consent to add the issuer's badge(s) to their Backpack. If the user is not currently logged into the Backpack, they will first be asked to log in or create an account if necessary.

#### Parameters

|Parameter| |
|:---|:---|
|`assertions`|Array of URLs or JSON Web Signatures to push to the Backpack.|
|`callback`|Function that **may** execute when returning from the Backpack interaction.|

#### Callback

If called, the callback function receives the following parameters:

|Parameter| |
|:---|:---|
|`errors`|Array of errors - each item includes: `assertion` (_URL or JSON Web Signature NOT added to Backpack_) and [`reason`](#error-constant-strings) (_constant string_)|
|`successes`|Array of assertions successfully added to the Backpack (_each represented by URL or JSON Web Signature_).|

#### Example method call

```js
var assertions = ['http://yoursite.com/badge-assertion.json', 
  'http://yoursite.com/other-badge-assertion.json',
  ...
  ];
OpenBadges.issue(assertions, function(errors, successes) {
 //...
}); 
```

__The `issue` method will behave like [`issue_no_modal`](#issue_no_modalassertions) for some browsers.__

#### Error Constant Strings

* `DENIED` - The user explicitly denied permission to add the badge to their Backpack.

* `EXISTS` - The badge is already in the user's Backpack.

* `INACCESSIBLE` - The assertion URL provided could not be retrieved. _For instance, the assertion URL itself may be malformed, or attempting to access the assertion may have resulted in 404 Not Found or 403 Forbidden._

* `MALFORMED` - The assertion URL provided exists but was malformed.

* `INVALID` - The assertion URL provided exists and is well-formed, but is not valid. _For instance, the recipient of the assertion may not be the currently logged-in user._

### `issue_no_modal(assertions)`

Redirects the page to a full-window version of the modal dialog described for [`issue`](#issueassertions-callback). While this does not allow the invocation of a callback with the results of the interaction, it is generally more compatible with older browsers.

#### Parameters

|Parameter| |
|:---|:---|
|`assertions`|_Array of URLs or JSON Web Signatures to push to the Backpack._|

#### Example method call

```js
var assertions = ['http://yoursite.com/badge-assertion.json', 
  'http://yoursite.com/other-badge-assertion.json',
  ...
  ];
OpenBadges.issue_no_modal(assertions); 
```

## Earner Backpack

Any badges successfully pushed to the earner Backpack can subsequently be managed by the earner along with any other badges they have.

## Threat Model

The reason we're even presenting the user with a dialog is because we want to prevent badge spamming, whereby third-party issuers spam a user's Backpack with badges that they don't want. Consequently, we need the Backpack to ask for the user's consent. This will be accomplished via an iframe embedded in the issuer's page.

The only sensitive information that a user needs to enter in this flow is login credentials. Since authentication is done via [BrowserID](https://browserid.org/), which opens in a pop-up window, the consequences of spoof attacks are minimal – so long as the user knows to look at domain names in their address bar and BrowserID's UI.

The [Backpack Connect API](backpack_connect.md) provides an alternative way to manage ongoing access to the earner's Mozilla Backpack, without requiring permission every time a badge is pushed.
