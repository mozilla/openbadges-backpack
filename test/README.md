# Open Badges Backpack Tests

## Latest Travis Build

[![Build Status](https://travis-ci.org/mozilla/openbadges.png?branch=development)](https://travis-ci.org/mozilla/openbadges)

*Note:* Travis may set `DISABLE_PHANTOM_TESTS`, which skips several tests that rely on `phantomjs` to run. See https://github.com/joyent/libuv/issues/826" for more details. These tests **should** be run locally.

## Manual Smoke Tests

The Backpack has many components that should be tested on every deployment. The following is a test script to be run manually, until it can be automated. It is not intended to be completely comprehensive, but should touch all the major components we expect to work.

### Issuer API

* Modal
* Modaless
* Backpack Connect

### Baker

* Manual baking
* Baking API

### Backpack

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

### Displayer API

* Retrieve user ID
* Retrieve collections
* Retrieve badges