var fs = require('fs')
  , _ = require('underscore')
  , mysql = require('../lib/mysql')
  , User = require('../models/user')
  , Badge = require('../models/badge');

var data = fs.readFileSync('badges.json').toString();
data = data.replace(/ "_id".*?,/g, '');
data = data.replace(/ "imageData".*?,/g, '');

var lines = data.split('\n');
lines.pop();

var entries = lines.map(JSON.parse);


var userEmails = entries.map(function (e) {
  return e.recipient;
});

var emails = _.uniq(userEmails)

emails.forEach(function (e) {
  User.findOrCreate(e, function (err, user) {
  });
});

setTimeout(function () {
  entries.forEach(function (e) {
    User.findOrCreate(e.recipient, function (err, user) {
      var endpoint = e.meta.pingback;
      var image = e.meta.imagePath;

      delete e.meta;

      var badge = new Badge({
        user_id: user.get('id'),
        type: 'hosted',
        endpoint: endpoint,
        image_path: image,
        body: e
      })

      badge.save(function (err,badge) {
        console.dir(err);
        console.dir(badge);
      });
    })
  })
}, 2000);