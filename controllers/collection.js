var Collection = require('../models/collection')
  , Badge = require('../models/collection')
  , logger = require('../lib/logging').logger
  , _ = require('underscore');

exports.param = {
  id: function(req, res, next, id) {
    Collection.findById(id, function(err, col) {
      if (err) {
        logger.error("Error pulling collection: " + err);
        return res.send('Error pulling collection', 500);
      }
      
      if (!col) {
        return res.send('Could not find collection', 404);
      }
      
      req.collection = col;
      return next();
    });
  }
}

exports.create = function (req, res) {
  if (!req.user) return res.send('nope', 400);
  if (!req.body) return res.send('nope', 400);
  if (!req.body.badges) return res.send('nope', 400);
  var user = req.user
    , body = req.body
  function makeNewBadge(attributes) { return new Badge(attributes); }
  var col = new Collection({
    user_id: user.get('id'),
    name: body.name,
    badges: body.badges.map(makeNewBadge)
  }); 

  col.save(function (err) {
    res.contentType('json');
    res.send({status: 'okay'});
  })
};

exports.update = function (req, res) {
  if (!req.user) return res.send('nope', 403);
  var col = req.collection
    , body = req.body
    , saferName = body.name.replace('<', '&lt;').replace('>', '&gt;');
  function makeNewBadge(attributes) { return new Badge(attributes); }
  col.set('name', saferName);
  col.set('badges', body.badges.map(makeNewBadge));
  col.save(function (err) {
    if (err) return res.send('nope', 500);
    res.contentType('json');
    res.send({status: 'okay'});
  })
};

exports.destroy = function (req, res) {
  if (!req.user) return res.send('nope', 400);
  var collection = req.collection
  collection.destroy(function (err) {
    if (err) return res.send('nope', 500);
    res.contentType('json');
    res.send(JSON.stringify({success: true}));
  })
};