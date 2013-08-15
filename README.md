# Mozilla Open Badges Backpack [![Build Status](https://secure.travis-ci.org/mozilla/openbadges.png?branch=redux-1.1)](http://travis-ci.org/mozilla/openbadges)

This is version 1.1 of the Open Badges Backpack, rebuilt from the
ground up.

## Prerequisites

Node 0.10.

[PhantomJS][] 1.8 or later is required to run the test suite.

## Quick Start

```
git clone -b redux-1.1 git://github.com/mozilla/openbadges.git backpack
cd backpack
npm install
npm test
DEBUG= COOKIE_SECRET=cookie node bin/backpack.js
```

Then visit http://localhost:3000.

## Environment Variables

**Note:** When an environment variable is described as representing a
boolean value, if the variable exists with *any* value (even the empty
string), the boolean is true; otherwise, it's false.

* `COOKIE_SECRET` is the secret used to encrypt and sign cookies,
  to prevent tampering.

* `DEBUG` represents a boolean value. Setting this to true makes the server
  use unminified source code on the client-side, among other things.

* `ORIGIN` is the origin of the server, as it appears
  to users. If `DEBUG` is enabled, this defaults to
  `http://localhost:PORT`. Otherwise, it must be defined.

* `ENABLE_STUBBYID` represents a boolean value. If it *and* `DEBUG` are
  both true, then the [stubbyid][] persona simulator is enabled. This allows
  anyone to easily log in as anyone they want, which makes manual testing
  and debugging easier. However, it should also *never* be enabled on
  production sites, which is why `DEBUG` must also be enabled for this
  feature to work.

* `PORT` is the port that the server binds to. Defaults to 3000.

* `SSL_KEY` is the path to a private key to use for SSL. If this
  is provided, the server must be accessed over HTTPS rather
  than HTTP, and the `SSL_CERT` environment variable must also
  be defined.

* `SSL_CERT` is the path to a SSL certificate. If this
  is provided, the server must be accessed over HTTPS rather
  than HTTP, and the `SSL_KEY` environment variable must also
  be defined.

## Test Coverage

Build/install [jscoverage][], run `make test-cov`, then open
`coverage.html` in a browser.

Coverage should always be at 100%. Pull requests that break this will
be rejected.

  [PhantomJS]: http://phantomjs.org/
  [stubbyid]: http://toolness.github.io/stubbyid/
  [jscoverage]: https://github.com/visionmedia/node-jscoverage
