var field = function(required, validators){ return { required: required, validators: validators }; };
var required = function() { return field(true, Array.prototype.slice.call(arguments)); };
var optional = function() { return field(false, Array.prototype.slice.call(arguments)); };

var modelFactory = function(){
  var model = function(data){ this.data = data || {}; };
  model.prototype.fields = {};
  model.prototype.errors = function(){
    var errors = {}
      , fields = this.fields
      , provided = this.data
      , expectedFields = Object.keys(fields);
    
    expectedFields.forEach(function(k){
      var errorType;
      if (!provided[k]) {
          if (fields[k].required) {
            errorType = 'missing';
          }
      } else {
          fields[k].validators.forEach(function(validator){
          try { validator(provided[k]); }
          catch (e) { errorType = e.message;  }
        });
      }
      if (errorType) {
        errors[k] = errorType;
      }
    });
    return errors;
  };
  return model;
};


var RegEx = function(regex, type) { return (
  function(input){ if (!regex.test(input)) throw new Error(type || 'regex'); }
)};
var MaxLength = function(len) { return (
  function(input) { if (input.length > len) throw new Error('length'); }
)};
var ISODate = function() {
  function simpleISODate(input) {
    var regex = /\d{4}-\d{2}-\d{2}/;
    if (!regex.test(input)) return 0;
    var pieces = input.split('-')
      , year = parseInt(pieces[0], 10)
      , month = parseInt(pieces[1], 10)
      , day = parseInt(pieces[2], 10)
    ;
    if (month > 12 || month < 1) return 0;
    if (day > 31 || day < 1) return 0;
    return (new Date(year, (month-1), day)).getTime();
  }
  return function(input){ if (!simpleISODate(input)) throw new Error('isodate');}
};
var Email = function(){
  // more or less RFC 2822
  var regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  return RegEx(regex, 'email');
};
var URL = function(){
  var fq_url = /^(https?):\/\/[^\s\/$.?#].[^\s]*$/;
  var local_url = /^\/\S+$/;
  return function(input) {
    try { RegEx(fq_url, 'url')(input); }
    catch(e) { RegEx(local_url, 'url')(input); }
  };
};


var Assertion = modelFactory();
var Badge = modelFactory();
var Issuer = modelFactory();

Assertion.prototype.fields = {
  //badge     : required(),
  recipient : required(Email()),
  evidence  : optional(URL()),
  expires   : optional(ISODate()),
  issued_at : optional(ISODate())
};
Badge.prototype.fields = {
  //issuer      : required(),
  version     : required(RegEx(/^v?\d+\.\d+\.\d+$/)),
  name        : required(MaxLength(128)),
  description : required(MaxLength(128)),
  image       : required(URL()),
  criteria    : required(URL())
};
Issuer.prototype.fields = {
  name    : required(MaxLength(128)),
  org     : optional(MaxLength(128)),
  contact : optional(Email()),
  url     : optional(URL())
};

var validate = function(assertionData){
  var badgeData = assertionData.badge || {}
    , issuerData = badgeData.issuer || {}
    , assertion = new Assertion(assertionData)
    , badge = new Badge(badgeData)
    , issuer = new Issuer(issuerData)
    , errors = {}
  ;
  function addToErrors(newErrors, prefix) {
    Object.keys(newErrors).forEach(function(field) {
      var key = prefix ? [prefix, '.', field].join('') : field;
      errors[key] = newErrors[field];
    });
  }
  addToErrors(assertion.errors());
  addToErrors(badge.errors(), 'badge');
  addToErrors(issuer.errors(), 'badge.issuer');
  return {
    status: Object.keys(errors).length ? 'failure' : 'success',
    error: errors
  };
};

if (typeof module !== 'undefined') {
  exports.validate = validate;
}
