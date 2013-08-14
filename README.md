# Mozilla Open Badges Backpack [![Build Status](https://secure.travis-ci.org/mozilla/openbadges.png?branch=redux-1.1)](http://travis-ci.org/mozilla/openbadges)

This is version 1.1 of the Open Badges Backpack, rebuilt from the
ground up.

## Prerequisites

Node 0.10.

## Quick Start

```
git clone -b redux-1.1 git://github.com/mozilla/openbadges.git backpack
cd backpack
npm install
npm test
```

## Test Coverage

Build/install [jscoverage][], run `make test-cov`, then open
`coverage.html` in a browser.

Coverage should always be at 100%. Pull requests that break this will
be rejected.

  [jscoverage]: https://github.com/visionmedia/node-jscoverage
