const test = require('tap').test;
const testUtils = require('./');
const conmock = require('./conmock');
const share = require('../controllers/share');

const User = require('../models/user');
const Badge = require('../models/badge');
const Group = require('../models/group');
const Portfolio = require('../models/portfolio');

testUtils.prepareDatabase({
  '1-user': new User({ email: 'brian@example.com' }),
  '2-other-user': new User({ email: 'lolwut@example.com' }),
  '3-badge': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: testUtils.makeAssertion()
  }),
  '4-group': new Group({
    user_id: 1,
    name: 'name',
    url: 'url',
    'public': 0,
    badges: [1]
  }),
  '5-portfolio': new Portfolio({
    group_id: 1,
    url: 'url',
    title: 'title',
    stories: {1: 'story'}
  })
}, function (fixtures) {
  test('share#createOrUpdate: no user', function (t) {
    conmock(share.createOrUpdate, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  test('share#createOrUpdate: wrong user', function (t) {
    const user = fixtures['2-other-user'];
    const group = fixtures['4-group'];
    const request = { user: user, group: group }
    conmock({
      handler: share.createOrUpdate,
      request: request,
    }, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  test('share#show: user stories added', function (t) {
    const portfolio = fixtures['5-portfolio'];
    const userStory = portfolio.get('stories')['1'];

    const user = fixtures['1-user'];
    const group = fixtures['4-group'];
    group.set('portfolio', portfolio);

    const request = { user: user, group: group };

    conmock({
      handler: share.show,
      request: request,
    }, function(err, mock) {
      var badgeUserStory = mock.options.portfolio.badges[0].get('_userStory');
      t.same(badgeUserStory, userStory, 'should be the same')
      t.end();
    });
  })

  testUtils.finish(test);
});


