var database = require('../lib/database'),
    validator = require('../lib/validator');

// where to store the badges
var collection = database.collection('badges');

var UserBadge = module.exports = function(data, meta, objectid){
  if (!(this instanceof UserBadge)) return new UserBadge(data, meta, objectid);
  this.data = data || {};
  this.meta = meta || {};
  this.id = objectid;
  delete this.data.meta;
}

UserBadge.prototype.save = function(callback){
  var self = this;
  callback = callback || function(){}

  // bail on validation errors
  var errors = this.errors();
  if (Object.keys(errors).length > 0) {
    return callback(errors, null);
  }
  // create the selector. use id if we have it; otherwise, use recipient and
  // the pingback url. not ideal, but okay for now.
  var selector = {}
  if (!this.id) {
    selector.recipient = this.data.recipient;
    selector['meta.pingback'] = this.meta.pingback;
  } else {
    selector['_id'] = this.id;
  }

  // really hacky, should clone object
  this.data.meta = this.meta;
  
  collection.upsert(selector, this.data, function(err){
    if (err) return callback(err);
    
    // quite annoying that I have to find after I upsert.
    collection.find(selector, function(err, docs){
      
      if (err) return callback(err);
      if (!docs) return callback(new Error("could not find after upsert"))
      self.id = docs.pop()['_id'];
      return callback(null, self);
    });
  })

  // see what I mean by hacky?
  delete this.data.meta;
}

UserBadge.prototype.errors = function(){
  var errors = validator.validate(this.data).errors;
  if (!this.meta.pingback) errors['meta.pingback'] = 'missing';
  return errors;
}

UserBadge.find = function(idOrSelector, callback){
  var selector = {}
    , type = typeof idOrSelector;
  callback = callback || function(){};
  if (type === 'object') {
    selector = idOrSelector
  } else if (type === 'string') {
    selector['_id'] = idOrSelector
  } else {
    throw "unacceptable selector, needs object or string";
  }
  if (selector['id']) {
    selector['_id'] = selector['id'];
    delete selector['id'];
  }
  if (selector['_id']){
    selector['_id'] = new database.ObjectID(selector['_id']);
  }
  collection.find(selector, function(err, docs){
    if (err) return callback(err);
    UserBadge.buildFromDatabase(docs, callback);
  });
}

UserBadge.buildFromDatabase = function(docs, callback) {
  var badges = []
  docs.forEach(function(doc){
    badges.push(new UserBadge(doc, doc.meta, doc['_id']));
  })
  callback(null, badges);
}
