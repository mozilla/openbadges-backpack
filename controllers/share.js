var User = require('../models/user')
  , Badge = require('../models/badge')
  , ObjectID = require('mongoose').mongo.BSONPure.ObjectID
  , reverse = require('../lib/router').reverse
  , configuration = require('../lib/configuration')
  , url = require('url')

exports.param = {}
exports.param['groupId'] = function(req, res, next, id) {
  var objId, badgeIds;
  if (req.url.match(/.js$/)) {
    req.query.js = true;
    id = id.replace(/.js$/, '');
  }
  try { objId = ObjectID(id) }
  catch(err) { return res.send('could not find group', 404) }
  badgeIds = []
  User.findOne({'groups': {'$elemMatch' : { _id : objId }}}, function(err, doc) {
    if (!doc) return res.send('could not find group', 404);
    badgeIds = doc.groups.id(objId).badges
    Badge.find({'_id': {'$in' : badgeIds}}, function(err, docs) {
      if (!docs.length) return res.send('could not find group', 404);
      req.badges = docs;
      req.groupId = id;
      return next();
    })
  })
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
  var badge = req.badge;
  res.render('badge-details.coffee', {
    layout: 'mini-details',
    recipient: badge.recipient,
    image: badge.meta.imagePath,
    type: badge.badge
  })
}