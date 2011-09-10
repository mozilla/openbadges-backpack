var mongoose = require('mongoose')
  , conf = require('../lib/configuration').get('database')

mongoose.connect(conf.host, conf.name, conf.port);

var urlre = /(^(https?):\/\/[^\s\/$.?#].[^\s]*$)|(^\/\S+$)/
  , emailre = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  , originre = /^(https?):\/\/[^\s\/$.?#].[^\s\/]*$/
  , versionre = /^v?\d+\.\d+\.\d+$/
  
var maxlen = function(len){
  return function(v){ return v.length < len }
}
var slashTrim = function(v){
  return v.replace(/\/*$/, '');
}

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId

var Badge = new Schema(
  { meta:
    { pingback  : String
    , publicKey : String
    , imagePath : String
    }
  , recipient : { type: String, required: true, match: emailre, index: true }
  , evidence  : { type: String, match: urlre }
  , expires   : Date
  , issued_on : Date
  , badge:
    { version     : { type: String, required: true, match: versionre }
    , name        : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
    , description : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
    , image       : { type: String, required: true, match: urlre }
    , criteria    : { type: String, required: true, match: urlre }
    , issuer:
      { origin  : { type: String, required: true, match: originre, set: slashTrim }
      , name    : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
      , org     : { type: String, validate: [maxlen(128), 'maxlen'] }
      , contact : { type: String, match: emailre, index: true }
      }
    }
  }
)

var BadgeModel = mongoose.model('Badge', Badge);

var instance = new BadgeModel({
  recipient: 'bimmy@example.com',
  evidence: '/bimmy-badge.json',
  expires: '2040-08-13',
  issued_on: '2011-08-23',
  badge: {
    version: 'v0.5.0',
    name: 'Open Source Contributor',
    description: 'For rocking in the free world',
    image: '/badge.png',
    criteria: 'http://example.com/criteria.html',
    issuer: {
      origin: 'http://p2pu.org',
      name: 'p2pu',
      org: 'school of webcraft',
      contact: 'admin@p2pu.org'
    }
  }
});


instance.validate(function(err){
  console.dir(err);
})
