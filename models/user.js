var mongoose = require('mongoose')
  , conf = require('../lib/configuration').get('database')
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId

mongoose.connect(conf.host, conf.name, conf.port);

var Group = new Schema(
  { name: { type: String }
  , badges: [String]
  }
)
var User = new Schema(
  { email: { type: String }
  , groups: [Group]
  }
)

var UserModel = module.exports = mongoose.model('User', User);
UserModel.prototype.groupExists = function(name) {
  return this.groups.some(function(g){ return g.name.toLowerCase() === name.toLowerCase() })
}
UserModel.prototype.updateBadgeGroups = function(badge, keep, newGroup, callback) {
  var updated = [];
  this.groups.forEach(function(g){
    if (!(g.id in keep)) {
      g.badges = g.badges.filter(function(b){ return b !== badge.id; });
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
