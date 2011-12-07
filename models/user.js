// #TODO: un-insane this. This is relational data and should be stored in a
// relational database (sqlite, postgre or mysql), not in mongo (or any other
// nosql database).
//
// This needs to be fixed before doing display API or facebook integration.
var mongoose = require('mongoose')
  , conf = require('../lib/configuration').get('database')
  , Badge = require('./badge')
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId

mongoose.connect(conf.host, conf.name, conf.port);

var Group = new Schema(
  { name: { type: String }
  , badges: [ObjectId]
  }
)
var User = new Schema(
  { email: { type: String }
  , groups: [Group]
  }
)
var UserModel = module.exports = mongoose.model('User', User);
UserModel.prototype.populateGroups = function(callback) {
  if (!this.groups.length) return callback();
  var times = {}
  times.amount = this.groups.length;
  times.hit = function() {
    times.amount -= 1;
    if (!times.amount) callback()
  }
  
  this.groups.forEach(function(g) {
    Badge.find({'_id': {'$in': g.badges}}, function(err, docs) {
      if (err) return callback(err)
      g.realBadges = docs;
      return times.hit();
    })
  })
}
UserModel.prototype.groupExists = function(name) {
  return this.groups.some(function(g){ return g.name.toLowerCase() === name.toLowerCase() })
}
UserModel.prototype.updateBadgeGroups = function(badge, keep, newGroup, callback) {
  var updated = [];
  this.groups.forEach(function(g){
    if (!(g.id in keep)) {
      g.badges = g.badges.filter(function(b){ return b.toString() !== badge.id; });
      if (g.badges.length) updated.push(g);
    } else {
      if (g.badges.indexOf(badge.id) === -1) g.badges.push(badge.id);
      updated.push(g);
    }
  })
  if (newGroup) {
    var exists = this.groups.map(function(g){ return g.name.toLowerCase(); }).indexOf(newGroup.toLowerCase()) !== -1
    if (!exists) {
      this.groups.push({
        name: newGroup,
        badges: [ badge.id ]
      })
      updated.push(this.groups.pop());
    }
  }
  UserModel.update({_id: this.id}, {'$set': {'groups': updated}}, callback)
}
