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
* [hurl][]: Web-based curl

[badgetest]: http://badgetest.herokuapp.com
[badgetest-https]: https://badgetest.herokuapp.com
[mockmyid]: http://mockmyid.com
[hurl]: http://hurl.it

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
* Repeat for https
    * Do the same three checks using [badgetest over https][badgetest-https].

#### Baker

* Manual baking
    * **NO SCRIPT**: This functionality may currently be broken.
* Baking API
    * Through `curl` issue a `GET` request to `/baker?assertion=http://backpack.openbadges.org/demo/badge.json` on the server you are testing, and redirect output to a `.png` filename.
        * You can optionally change `http://backpack.openbadges.org/` to be the server under test.
        * E.g. ```curl http://openbadges.mofostaging.net/baker?assertion=http://openbadges.mofostaging.net/demo/badge.json > badge.png```
    * Verify the PNG file is a baked badge.

#### Backpack

* Sign up
    * **NO SCRIPT**: Repeatedly testing sign up is incredibly tedious as it requires repeatedly creating/deleting Persona accounts.
* Log in: *user should be able to log in*
    * Navigate to the appropriate Backpack server, e.g. http://openbadges.mofostaging.net.
    * Log out if already logged in.
    * Log in.
        * *Note*: If logging in returns you to the log in screen with no error, delete old cookies for the site and try again.
* Badge upload/deletion: *user should be able to upload a baked badge, and delete badges from account*
    * Log in as `someone@mockmyid.com`.
    * Navigate to the badge upload page.
    * Upload a baked badge.
        * A badge baked for `someone@mockmyid.com` should be available [here][baked].
    * Verify that it appears in your badge list.
    * Delete it.
    * Refresh the page and ensure the badge remains deleted.
* Badge views: *user should be able to view their badges*
    * View recent view.
    * Ensure that appropriate badges are shown.
    * View all view.
    * Ensure that appropriate badges are shown.
* Collections
    * Creation: *user should be able to group their badges in collections*
        * Navigate to the collections page.
        * Drag badges, one at a time, into a new collection.
        * Ensure a new collection appears with the dragged badges.
    * Deletion: *user should be able to delete collection*
        * Delete the collection.
        * Refresh the page.
        * Ensure the collection is gone.
* Share pages
    * Creation: *user should be able to share collections*
        * Create a collection.
        * Click the share icon.
        * Ensure you are taken to a share page for the collection.
    * Editing: *user should be able to edit details of the share page*
        * Edit the share page title, subtitle, and badge stories.
        * Save the page.
        * Ensure your edits are preserved on the page you are shown.
    * Logged out view: *share pages should be publicly viewable*
        * Visit the share page url while logged out.
        * Ensure it looks appropriate and is not editable.
    * Deletion: *share pages should go away when the underlying collection does*
        * Navigate to the collections screen. 
        * Delete the collection.
        * Navigate to the share page url and ensure it is not available.

[baked]: http://badgetest.herokuapp.com/baked/someone-at-mockmyid-dot-com.png

#### Displayer API

* Retrieve user ID: *user ID should be retreivable from account email*
  * Navigate to `/displayer/convert/email/` for the Backpack server you are testing.
  * Enter your account email address.
  * Run the converter and note the id returned.
* Retrieve collections: *public collections should be listed*
  * Ensure you have a collection in your account.
  * Ensure its `public` checkbox is checked.
  * Through `curl` (or [hurl][]) issue a `GET` request to `/displayer/{{ ID }}/groups.json` on the server you are testing.
  * Ensure your public group is listed, with appropriate data.
  * Note the `groupId`.
* Retrieve badges: *badges for public collections should be listed*
  * Through `curl` (or [hurl][]) issue a `GET` request to `/displayer/{{ ID }}/group/{{ groupId }}.json` on the server you are testing.
  * Ensure your grouped badges are listed, with appropriate data.
  
