var mongoose = require('mongoose')
  , conf = require('../lib/configuration').get('database')

mongoose.connect(conf.host, conf.name, conf.port);

var urlre = /(^(https?):\/\/[^\s\/$.?#].[^\s]*$)|(^\/\S+$)/
  , emailre = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  , originre = /^(https?):\/\/[^\s\/$.?#].[^\s\/]*$/
  , versionre = /^v?\d+\.\d+\.\d+$/
  
var maxlen = function(len){
  return function(v){ return (v||'').length < len }
}

var slashTrim = function(v){
  return v.replace(/\/*$/, '');
}

var isodate = function(){}
isodate.set = function(input) {
  var expression = /\d{4}-\d{2}-\d{2}/;
  if (!expression.test(input)) return false;
  var pieces = input.split('-')
    , year = parseInt(pieces[0], 10)
    , month = parseInt(pieces[1], 10)
    , day = parseInt(pieces[2], 10)
  if (month > 12 || month < 1) return false;
  if (day > 31 || day < 1) return false;
  return (new Date(year, (month-1), day)).getTime();
};
isodate.validate = function(v) { return v === null || v > 0; }

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
  , expires   : { type: String, set: isodate.set, validate: [isodate.validate, 'isodate'] }
  , issued_on : { type: String, set: isodate.set, validate: [isodate.validate, 'isodate'] }
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

var BadgeModel = module.exports = mongoose.model('Badge', Badge);

// var instance = new BadgeModel({
//   recipient: 'bimmy@example.com',
//   evidence: '/bimmy-badge.json',
//   expires: '2040-08-13',
//   issued_on: '2011-08-23',
//   badge: {
//     version: 'v0.5.0',
//     name: 'Open Source Contributor',
//     description: 'For rocking in the free world',
//     image: '/badge.png',
//     criteria: 'http://example.com/criteria.html',
//     issuer: {
//       origin: 'http://p2pu.org',
//       name: 'p2pu',
//       org: 'school of webcraft',
//       contact: 'admin@p2pu.org'
//     }
//   }
// });
