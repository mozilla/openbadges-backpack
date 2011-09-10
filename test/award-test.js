var vows = require('./setup')
  , assert = require('assert')
  , award = require('../lib/award')
  , fs = require('fs')
  , path = require('path')
  , assertion = require('./utils').fixture()

var PNGFILE = path.join(__dirname, 'no-badge-data.png')
  , PNGDATA = fs.readFileSync(PNGFILE)

