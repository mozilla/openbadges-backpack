const test = require('tap').test;
const testUtils = require('./');
const Portfolio = require('../models/portfolio');
const User = require('../models/user');
const Group = require('../models/group');

const UNICODE_TITLE = "てすと";

testUtils.prepareDatabase({
  '1-user': new User({ email: 'brian@example.org' }),
  '2-group': new Group({ user_id: 1, name: 'lol', badges: [] })
}, function () {

  test('Portfolio#save: unicode characters in the title', function (t) {
    const portfolio = new Portfolio({
      group_id: 1,
      title: UNICODE_TITLE,
      stories: {}
    });

    portfolio.save(function (err, result) {
      t.notOk(err, 'should not have an error');

      Portfolio.findOne({ title: UNICODE_TITLE }, function (err, result) {
        t.notOk(err, 'should not have an error');
        t.ok(result, 'should have a result')
        t.same(result.get('title'), UNICODE_TITLE, 'should have the correct title');
        t.end();
      });
    });
  });

  test('Portfolio#save: generates URL', function (t) {
    const portfolio = new Portfolio({
      group_id: 1,
      title: "oh hey",
      stories: {}
    });
    portfolio.save(function (err, result) {
      t.notOk(err, 'should not have an error');
      t.ok(result.get('url'), 'should have a url');
      t.end();
    });
  });

  testUtils.finish(test);
})

