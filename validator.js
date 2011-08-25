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
        try { validator.validate(provided[k]); }
        catch (e) { errorType = e.message;  }
      });
    }
    if (errorType) {
      errors[k] = errorType;
    }
  });
  return errors;
};

var Validator = function(vdef) {
  var F = function(args) {
    if (!(this instanceof F)) return new F(arguments);
    this.init.apply(this, args.callee ? args : arguments);
  }
  F.prototype.init = function(args){
    var opts = vdef.opts || [];
    for (var i = 0; i < opts.length; i +=1) {
      this[opts[i]] = arguments[i];
    }
  }
  F.prototype.throwError = function(code) {
    throw new Error(code || this.code);
  }
  F.prototype.validate = function(input, code) {
    var sanitized = this.clean(input);
    if (!this.test(sanitized)) {
      this.throwError(code);
    }
  }
  F.prototype.code = vdef.code || 'validation';
  F.prototype.clean = vdef.clean || function(input){ return input };
  F.prototype.test = vdef.test;
  return F;
}

var regex = Validator({
  code: 'regex',
  opts: ['expression'],
  test: function(input){ return this.expression.test(input); }
});
var maxlength = Validator({
  code: 'length',
  opts: ['maxlen'],
  test: function(input){ return input.length < this.maxlen; }
})
var isodate = Validator({
  code: 'isodate',
  clean: function(input) {
    var regex = /\d{4}-\d{2}-\d{2}/;
    if (!regex.test(input)) return false;
    var pieces = input.split('-')
      , year = parseInt(pieces[0], 10)
      , month = parseInt(pieces[1], 10)
      , day = parseInt(pieces[2], 10)
    ;
    if (month > 12 || month < 1) return false;
    if (day > 31 || day < 1) return false;
    return (new Date(year, (month-1), day)).getTime();
  },
  test: function(input) { return input !== false; }
})
var email = Validator({
  code: 'email',
  test: function(input) {
    var EMAIL_RE = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return regex(EMAIL_RE).test(input);
  }
})
var url = Validator({
  code: 'url',
  test: function(input) {
    var FQ_URL_RE = /^(https?):\/\/[^\s\/$.?#].[^\s]*$/;
    var LOCAL_URL_RE = /^\/\S+$/;
    return regex(FQ_URL_RE).test(input) || regex(LOCAL_URL_RE).test(input);
  }
});

var Assertion = Model({
  //badge     : required(),
  recipient : required( email() ),
  evidence  : optional( url() ),
  expires   : optional( isodate() ),
  issued_at : optional( isodate() )
});
var Badge = Model({
  //issuer      : required(),
  version     : required( regex(/^v?\d+\.\d+\.\d+$/) ),
  name        : required( maxlength(128) ),
  description : required( maxlength(128) ),
  image       : required( url() ),
  criteria    : required( url() )
});
var Issuer = Model({
  name    : required( maxlength(128) ),
  org     : optional( maxlength(128) ),
  contact : optional( email() ),
  url     : optional( url() )
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
  exports.isodate = isodate;
}
