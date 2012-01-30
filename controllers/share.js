var User = require('../models/user')
  , Badge = require('../models/badge')
  , Collection = require('../models/collection')
  , reverse = require('../lib/router').reverse
  , configuration = require('../lib/configuration')
  , url = require('url')

exports.param = {}
exports.param['groupId'] = function(req, res, next, id) {
  if (req.url.match(/.js$/)) {
    req.query.js = true;
    id = id.replace(/.js$/, '');
  }
  Collection.findOne({url: id}, function (err, collection) {
    // #TODO: better job of logging what happened on errors
    if (err || !collection) { return res.send('Could not find group', 404); }
    collection.getBadgeObjects(function (err, badges) {
      if (err) { return res.send('Could not get badges', 500); }
      req.badges = badges;
      req.groupId = id;
    })
  })
  return next();
}
exports.group = function(req, res) {
  if (req.query && req.query.js) {
    var iframeurl = url.parse(reverse('share.group', {groupId: req.groupId}))
    iframeurl.hostname = configuration.get('hostname');
    iframeurl.protocol = configuration.get('protocol');
    iframeurl.port = configuration.get('external_port');
    res.setHeader('Content-Type', 'text/javascript');
    return res.send('document.write("<iframe frameborder=0 src=\''+ url.format(iframeurl) +'\'></iframe>")')
  }
  res.render('share-frame.coffee', {
    layout: false,
    badges: req.badges
  });
}

exports.badge = function(req, res) {
  var badge = req.badge
    , assertion = badge.data.body;
  res.render('badge-details.coffee', {
    layout: 'mini-details',
    recipient: assertion.recipient,
    image: badge.image_path,
    type: assertion.badge
  });
}