var Collection = require('../models/collection')
  , logger = require('../lib/logging').logger;

exports.create = function (req, res) {
  var badges = [];
  if (!req.user) res.send('nope', 400);
  if (!req.body) res.send('nope', 400);
  if (!req.body.badges) res.send('nope', 400);
  
  var col = new Collection({
    badges: req.body.badges,
    user_id: req.user.data.id
  }); 
  
  console.dir(req.body.badges);
  
  col.save(function (err, col) {
    if (err) {
      logger.error("error saving collection");
      logger.error(err);
      return res.send('internal server error', 500);
    }
    res.contentType('json');
    res.send(JSON.stringify({newId: col.id}));
  })
};