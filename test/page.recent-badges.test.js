const test = require('tap').test;
const utils = require('./page-utils');

test('recentBadges.html', function(t) {

  t.test('with 0 badges', function(t) {
    utils.render('recentBadges.html', {badges: []}, function(err, $) {
      t.notOk(err, 'no error');
      t.ok($('body').html().match(utils.noBadgesPattern), 'no badge message displayed');
      t.end();
    });
  });

  t.test('with 2 badges', function(t) {
    utils.render('recentBadges.html', { badges: utils.badgeList(2) }, function(err, $) {
      t.notOk(err, 'no error');
      t.same($('.openbadge').length, 2, 'renders 2 badges');
      t.end();
    });
  });

});