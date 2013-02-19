var test = require('tap').test;
var qunitTap = require('./utils/qunit-tap');

test('root qunit tests', qunitTap.testRunner('/test/'));

test('badge-accept qunit tests', qunitTap.testRunner('/test/badge-accept/'));

test('backpack qunit tests', qunitTap.testRunner('/test/backpack/'));
