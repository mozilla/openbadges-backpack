var Group = require('../models/group')
  , Badge = require('../models/badge')
  , logger = require('../lib/logging').logger
  , _ = require('underscore');

exports.param = {
  groupId: function(req, res, next, id) {
    Group.findById(id, function(err, group) {
      if (err) {
        logger.error("Error pulling group: " + err);
        return res.send('Error pulling group', 500);
      }
      
      if (!group) {
        return res.send('Could not find group', 404);
      }
      
      req.group = group;
      return next();
    });
  }
}

exports.create = function (req, res) {
  if (!req.user) return res.json({error:'no user'}, 403);
  if (!req.body) return res.json({error:'no badge body'}, 400);
  if (!req.body.badges) return res.json({error:'no badges'}, 400);
  var user = req.user
    , body = req.body
    , badges = body.badges
    , group
  function makeNewBadge(attributes) { return new Badge(attributes); }
  group = new Group({
    user_id: user.get('id'),
    name: body.name,
    badges: badges.map(makeNewBadge)
  }); 

  group.save(function (err, group) {
    res.contentType('json');
    res.send({id: group.get('id'), url: group.get('url')});
  })
};

exports.update = function (req, res) {
  if (!req.user) return res.send('nope', 403);
  var group = req.group
    , body = req.body
    , saferName = body.name.replace('<', '&lt;').replace('>', '&gt;');
  function makeNewBadge(attributes) { return new Badge(attributes); }
  group.set('name', saferName);
  group.set('badges', body.badges.map(makeNewBadge));
  group.save(function (err) {
    if (err) return res.send('nope', 500);
    res.contentType('json');
    res.send({status: 'okay'});
  })
};

exports.destroy = function (req, res) {
  if (!req.user) return res.send('nope', 400);
  var group = req.group
  group.destroy(function (err) {
    if (err) {
      logger.debug('some sort of error deleting!');
      logger.debug(err);
      return res.send('nope', 500);
    }
    res.contentType('json');
    res.send(JSON.stringify({success: true}));
  })
};