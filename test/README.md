# Open Badges Backpack Tests

## Latest Travis Build

[![Build Status](https://travis-ci.org/mozilla/openbadges.png?branch=development)](https://travis-ci.org/mozilla/openbadges)

*Note:* Travis may set `DISABLE_PHANTOM_TESTS`, which skips several tests that rely on `phantomjs` to run. See https://github.com/joyent/libuv/issues/826" for more details. These tests **should** be run locally.

## Manual Smoke Tests

The Backpack has many components that should be tested on every deployment. The following is a test script to be run manually, until it can be automated. It is not intended to be completely comprehensive, but should touch all the major components we expect to work.

### Tools

These 3rd party tools may be useful in testing the Backpack:

* [badgetest][]: Issues configurable junk badges for testing
* [mockmyid][]: Useful for quick persona log-in through a throwaway account

[badgetest]: http://badgetest.herokuapp.com
[mockmyid]: http://mockmyid.com

### Script
#### Issuer API

* Modal: *user should be able to accept a badge through the modal Issuer API*
    * Navigate to [badgetest][].
    * Issue a badge to the appropriate server through the modal API call.
    * Visit the Backpack and ensure the badge is there.
    * Delete the badge.
* Modaless: *user should be able to accept a badge through the modaless Issuer API*
    * Navigate to [badgetest][].
    * Issue a badge to the appropriate server through the modaless API call.
    * Visit the Backpack and ensure the badge is there.
    * Delete the badge.
* Backpack Connect: *user should be able to accept a badge through Backpack Connect*
    * Navigate to [badgetest][].
    * Connect to the appropriate server through Backpack Connect.
    * Grant permission to `badgetest` in the Backpack dialog.
    * Issue a badge to the appropriate server through Backpack Connect.
    * Visit the Backpack and ensure the badge is there.
    * Delete the badge.

#### Baker

* Manual baking
* Baking API

#### Backpack

* Sign up
* Log in
* Badge upload/deletion
* Badge views
* Collections
    * Creation
    * Deletion
* Share pages
    * Creation
    * Editing
    * Deletion
    * Logged out view

#### Displayer API

* Retrieve user ID
* Retrieve collections
* Retrieve badges
