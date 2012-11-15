const test = require('./');
const fs = require('fs');
const path = require('path');
const awardBadge = require('../lib/award');
const mysql = require('../lib/mysql');
const Badge = require('../models/badge');

const TEST_ASSERTION = require('../lib/utils').fixture();
const BADGE_DIRECTORY = path.basename(require('../lib/configuration').get('badge_path'));
const PNG_DATA = fs.readFileSync(path.join(__dirname, '/utils/images/no-badge-data.png'));

test.prepareDatabase(function (done) {
  test('awardBadge', function (t) {
    const endpoint = 'http://example.com/badge';
    const badgeData = {
      assertion: TEST_ASSERTION,
      url: endpoint,
      imagedata: PNG_DATA,
      recipient: TEST_ASSERTION.recipient
    }

    awardBadge(badgeData, function (err, badge) {
      t.notOk(err, 'should not have an error');
      Badge.find({endpoint: endpoint}, function (err, badges) {
        t.notOk(err, 'should not have an error');
        t.same(badges.length, 1, 'should have exactly one badge');
        var badgePath = badges[0].get('image_path');
        t.ok(badgePath.match(BADGE_DIRECTORY), 'should match');
        t.end();
      });
    })
  });

  test.closeDatabase();
});
