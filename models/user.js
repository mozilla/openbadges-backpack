var mongoose = require('mongoose')
  , conf = require('../lib/configuration').get('database')
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId

mongoose.connect(conf.host, conf.name, conf.port);

var Group = new Schema(
  { name: { type: String }
  , badges: [ObjectId]
  }
)
var User = new Schema(
  { email: String
  , groups: [Group]
  }
)

var UserModel = module.exports = mongoose.model('User', User);
