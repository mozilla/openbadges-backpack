var Collection = require('../models/collection')
  , logger = require('../lib/logging').logger;

exports.create = function (req, res) {
  if (!req.user) res.send('nope', 400);
  if (!req.body) res.send('nope', 400);
  if (!req.body.badges) res.send('nope', 400);
  
  var col = new Collection({
    badges: req.body.badges,
    user_id: req.user.data.id,
    name: req.body.name
  }); 
  
  console.dir(req.body.badges);
  
  col.save(function (err, col) {
    if (err) {
      logger.error("error saving collection");
      logger.error(err);
      return res.send('internal server error', 500);
    }
    res.contentType('json');
    res.send(JSON.stringify(col.data));
  })
};

exports.update = function (req, res) {
  if (!req.user) res.send('nope', 400);
  if (!req.body) res.send('nope', 400);
  if (!req.body.badges) res.send('nope', 400);

  console.dir(req.body);


  Collection.findById(req.body.id, function (err, collection) {
    if (err) return res.send('nope', 500);
    if (!collection) return res.send('nope', 404);
    
    collection.data.name = req.body.name.replace('<', '&lt;').replace('>', '&gt;');
    collection.data.badges = req.body.badges;
    collection.save(function (err, col) {
      if (err) return res.send('nope', 500);
      res.contentType('json');
      res.send(JSON.stringify(col.data));
    })
  })
}
