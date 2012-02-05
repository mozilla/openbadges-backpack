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
    , badges = body.badges
    , col = new Collection({
      user_id: user.get('id'),
      name: body.name
    }); 
  function makeNewBadge(attributes) { return new Badge(attributes); }
  col.set('badges', badges.map(makeNewBadge))
  col.save(function (err, col) {
    if (err) {
      logger.error("error saving collection");
      logger.error(err);
      return res.send('internal server error', 500);
    }
    res.contentType('json');
    res.send(JSON.stringify(col.attributes));
  })
};

exports.update = function (req, res) {
  if (!req.user) return res.send('nope', 403);
  var collection = req.collection
    , badges = collection.badges
    , body = req.body
    , saferName = body.name.replace('<', '&lt;').replace('>', '&gt;');
  
  function makeNewBadge(attribs) { return new Badge(attribs); }
  collection.set('name', saferName);
  collection.set('badges', body.badges.map(makeNewBadge));
  collection.save(function (err, col) {
    if (err) return res.send('nope', 500);
    col.set('badges', badges);
    res.contentType('json');
    res.send(JSON.stringify(col.attributes));
  })
}
