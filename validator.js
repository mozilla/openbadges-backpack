var validator_factory = function(){
  var validator = function(data){ this.data = data || {}; }
  validator.prototype.validate = function(){
    var errors = []
    console.dir(this.data);
    console.dir(this.fields);
    return errors;
  }
  return validator;
};

var field = function(required, validators){}

var Assertion = validator_factory()
var Badge = validator_factory()
var Issuer = validator_factory()

Assertion.prototype.fields = {
  recipient : field(true, []),
  badge     : field(true, []),
  evidence  : field(false, []),
  expires   : field(false, []),
  issued_at : field(false, [])
}
Badge.prototype.fields = {
  version     : field(true, []),
  name        : field(true, []),
  image       : field(true, []),
  description : field(true, []),
  criteria    : field(true, []),
  issuer      : field(true, [])
}
Issuer.prototype.fields = {
  name    : field(true, []),
  org     : field(false, []),
  contact : field(false, []),
  url     : field(false, [])
}

exports.validate = function(assertion){
  return {status: 'okay', error: []}
}
exports.Assertion = Assertion
exports.Badge = Badge
exports.Issuer = Issuer
