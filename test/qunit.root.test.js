var test = require('tap').test;
var qunitTap = require('./utils/qunit-tap');

test('root qunit tests', qunitTap.details(), qunitTap.testRunner('/test/'));
