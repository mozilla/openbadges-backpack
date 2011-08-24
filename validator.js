var field = function(required, validators){ return { required: required, validators: validators }; };
var required = function() { return field(true, Array.prototype.slice.call(arguments)); };
var optional = function() { return field(false, Array.prototype.slice.call(arguments)); };

var Model = function(fields){
  var F = function(data) {
    if (!(this instanceof F)) return new F(data);
    this.data = data || {};
    this.fields = fields || {};
  };
  F.prototype = Model.prototype;
  return F;
}
Model.prototype.init = function(data) {
}
Model.prototype.errors = function() {
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


// ValidatorFactory -> ValidatorGenerator -> Validator
  
// ValidatorGenerator(args):
//   * throwError(type, msg): make a new error, throw it.
//   returns Validator(input):
//      * clean() - return a processed string, or null
//      * validate() - throwError(msg) if invalid

var Validator = function(vdef) {
  var noop = function(input){ return input };
  var fixer = function(F, arguments) {
  }
  var F = function(args) {
    if (!(this instanceof F)) return new F(arguments);
    this.init.apply(this, args.callee ? args : arguments);
  }
  F.prototype.init = function(args){
    this.code = vdef.code || 'validation';
    this.clean = vdef.clean || noop;
    this.test = vdef.test;
    for (var i = 0, opts = vdef.opts; i < opts.length; i +=1) {
      this[opts[i]] = arguments[i];
    }
  }
  F.prototype.throwError = function(code) {
    throw new Error(code || this.code);
  }
  F.prototype.validate = function(input, code) {
    var sanitized = this.clean(input);
    if (!vdef.test(sanitized)) {
      this.throwError(code);
    }
  }
  return F;
}
var regex = Validator({
  code: 'regex',
  opts: ['expression'],
  test: function(input){}
});
console.dir(regex(/whatlol/).expression );


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

var Assertion = Model({
  //badge     : required(),
  recipient : required(Email()),
  evidence  : optional(URL()),
  expires   : optional(ISODate()),
  issued_at : optional(ISODate())
});
var Badge = Model({
  //issuer      : required(),
  version     : required(RegEx(/^v?\d+\.\d+\.\d+$/)),
  name        : required(MaxLength(128)),
  description : required(MaxLength(128)),
  image       : required(URL()),
  criteria    : required(URL())
});
var Issuer = Model({
  name    : required(MaxLength(128)),
  org     : optional(MaxLength(128)),
  contact : optional(Email()),
  url     : optional(URL())
});

var validate = function(assertionData){
  var badgeData = assertionData.badge || {}
    , issuerData = badgeData.issuer || {}
    , assertion = Assertion(assertionData)
    , badge = Badge(badgeData)
    , issuer = Issuer(issuerData)
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
