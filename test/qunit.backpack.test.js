var test = require('tap').test;
var qunitTap = require('./utils/qunit-tap');

test('backpack qunit tests', qunitTap.details(), qunitTap.testRunner('/test/backpack/'));
