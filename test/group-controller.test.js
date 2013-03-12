const test = require('tap').test;
const testUtils = require('./');
const conmock = require('./conmock');
const groupcontroller = require('../controllers/group');

const User = require('../models/user');
const Badge = require('../models/badge');
const Group = require('../models/group');

testUtils.prepareDatabase({
  '1-user': new User({ email: 'brian@example.org' }),
  '2-other-user': new User({ email: 'other-user@example.org' }),
  '3-badge': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: testUtils.makeAssertion({})
  }),
  '4-destroy-group': new Group({
    user_id: 1,
    name: 'Fleeting',
    badges: []
  }),
  '5-update-group': new Group({
    user_id: 1,
    name: 'Update',
    'public': false,
    badges: []
  }),
}, function (fixtures) {
  test('group#create: no user', function (t) {
    conmock(groupcontroller.create, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  test('group#create: no badges in the body', function (t) {
    const user = fixtures['1-user'];
    conmock({
      handler: groupcontroller.create,
      request: { user: user, body: {}},
    }, function (err, mock) {
      t.same(mock.status, 400, 'should be a 400');
      t.ok(mock.body.error.match(/badges/i), 'should be a missing badges error');
      t.end();
    });
  });

  test('group#create: correct input', function (t) {
    const user = fixtures['1-user'];
    const badge = fixtures['3-badge'];
    const request = {
      user: user,
      body: { name: 'awesometown', badges:[ badge.get('id') ] }
    };
    conmock({
      handler: groupcontroller.create,
      request: request,
    }, function (err, mock) {
      t.ok(mock.body.url, 'should have a url');
      t.ok(mock.body.id, 'should have an id');
      t.end();
    });
  });

  test('group#destroy: no user', function (t) {
    conmock(groupcontroller.destroy, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  test('group#destroy: no group', function (t) {
    const user = fixtures['1-user'];
    conmock({
      handler: groupcontroller.destroy,
      request: { user: user }
    }, function (err, mock) {
      t.same(mock.status, 404, 'should be missing');
      t.end();
    });
  });

  test('group#destroy: wrong user', function (t) {
    const user = fixtures['2-other-user'];
    const group = fixtures['4-destroy-group'];
    conmock({
      handler: groupcontroller.destroy,
      request: { user: user, group: group },
    }, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  test('group#destroy: correct user', function (t) {
    const user = fixtures['1-user'];
    const group = fixtures['4-destroy-group'];
    conmock({
      handler: groupcontroller.destroy,
      request: { user: user, group: group },
    }, function (err, mock) {
      t.same(mock.status, 200, 'should be successful');
      t.end();
    });
  });

  test('group#update: no user', function (t) {
    conmock(groupcontroller.update, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  test('group#update: no group', function (t) {
    const user = fixtures['1-user'];
    conmock({
      handler: groupcontroller.update,
      request: { user: user }
    }, function (err, mock) {
      t.same(mock.status, 404, 'should be missing');
      t.end();
    });
  });

  test('group#update: wrong user', function (t) {
    const user = fixtures['2-other-user'];
    const group = fixtures['5-update-group'];
    conmock({
      handler: groupcontroller.update,
      request: { user: user, group: group },
    }, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  test('group#update: updating name', function (t) {
    const user = fixtures['1-user'];
    const group = fixtures['5-update-group'];
    const newName = 'Updated';
    const request = {
      user: user,
      group: group,
      body: { name: newName }
    };
    conmock({
      handler: groupcontroller.update,
      request: request,
    }, function (err, mock) {
      t.same(group.get('name'), newName, 'should have updated the name');
      t.end();
    });
  });

  test('group#update: updating public field', function (t) {
    const user = fixtures['1-user'];
    const group = fixtures['5-update-group'];
    const newName = 'Updated';
    const request = {
      user: user,
      group: group,
      body: { 'public': true }
    };
    conmock({
      handler: groupcontroller.update,
      request: request,
    }, function (err, mock) {
      t.same(group.get('public'), true, 'should have updated the public field');
      t.end();
    });
  });

  testUtils.finish(test);
});

