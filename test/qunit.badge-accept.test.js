var test = require('tap').test;
var qunitTap = require('./utils/qunit-tap');

test('badge-accept qunit tests', qunitTap.details(), qunitTap.testRunner('/test/badge-accept/'));
