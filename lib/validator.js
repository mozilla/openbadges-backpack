// Validator is a factory for building validator generators. Takes a validator template
// and returns a validator generator, which (optionally) takes arguments to generate the
// final validator instance, containing `validate`, `test` and `clean` methods.
// 
// `vdef` is an object containing the following:
//
//   * `type`: String representing the type of validation. If the validation fails,
//   this will be used as the argument to `Error()` when it is thrown.
//
//   * `opts`: Array of names to give arguments passed to the validator
//   generator. Can be referenced in `clean` and `test` functions under `this`
//   object.
//
//   * `clean`: (Optional) Function to preprocess input before invoking test method. 
//
//   * `test`: Function returning `true` if input is valid, `false` otherwise.
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
  F.prototype.throwError = function(type) {
    throw new Error(type || this.type);
  }
  F.prototype.validate = function(input, type) {
    var sanitized = this.clean(input);
    if (!this.test(sanitized)) {
      this.throwError(type);
    }
  }
  F.prototype.type = vdef.type || 'validation';
  F.prototype.clean = vdef.clean || function(input){ return input };
  F.prototype.test = vdef.test;
  return F;
}

// Model is a factory for generating models given fields and their validation
// requirements.
//
// `fields` is an object where the keys are the names of the expected (not
// necessarily required) fields and the values are an object containing
// `required`, a boolean, and `validators`, an array of objects containing a
// `validate` method that takes an input and throws an error if deemed
// invalid.
//
// A generated model is a constructor that takes an object, presumably with
// keys matching the ones defined in `fields`, and returns an object with an
// `errors` method.
var Model = function(fields){
  var F = function(data) {
    if (!(this instanceof F)) return new F(data);
    this.data = data || {};
    this.fields = fields || {};
  };
  F.prototype = Model.prototype;
  return F;
}

// Using the field definition passed in as `fields` to the Model factory,
// `errors()` goes over the fields expected by a model checks for existence if
// they are `required` and runs the `validators` on the input. Collects all
// errors and passes them in an errors object keyed by field name. If there
// are no errors, returns an empty object.
Model.prototype.errors = function() {
  var errors = {}
    , fields = this.fields
    , provided = this.data
    , expectedFields = Object.keys(fields);
  expectedFields.forEach(function(k){
    var validators = fields[k].validators
      , input = provided[k]
      , required = fields[k].required;
    if (!input) {
      if (required) errors[k] = 'missing';
      return 'totally rad';
    }
    validators.forEach(function(v){
      try { v.validate(input); }
      catch (e) { errors[k] = e.message; }
    });
  });
  return errors;
};

// The isodate validator `clean` function is not idempotent -- it explicitly
// checks for an iso date in YYYY-MM-DD format and converts it to unix
// time. If the value being cleaned is already in unix time, it will return
// false, which will cause the `test` method to fail.
var isodate = Validator({
  type: 'isodate',
  clean: function(input) {
    var expression = /\d{4}-\d{2}-\d{2}/;
    if (!expression.test(input)) return false;
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
});
var regex = Validator({
  type: 'regex',
  opts: ['expression'],
  test: function(input){ return this.expression.test(input); }
});
var maxlength = Validator({
  type: 'length',
  opts: ['maxlen'],
  test: function(input){ return input.length < this.maxlen; }
});
// The regular expression checking email values lets a lot of addresses
// through that would be, by current standards, unreachable. This is okay --
// it's a basic sanity check, since the email will be validated for real by
// smtp challenge when a user tries to log in.
var email = Validator({
  type: 'email',
  test: function(input) {
    var EMAIL_RE = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return regex(EMAIL_RE).test(input);
  }
});
// Again, the validation for the fully-qualified version of the url is fairly
// liberal. We will do a HEAD request on the full url to ensure existence and
// an acceptable response before storing.
var url = Validator({
  type: 'url',
  test: function(input) {
    var FQ_URL_RE = /^(https?):\/\/[^\s\/$.?#].[^\s]*$/;
    var LOCAL_URL_RE = /^\/\S+$/;
    return regex(FQ_URL_RE).test(input) || regex(LOCAL_URL_RE).test(input);
  }
});
// Some helper methods for generating the structure required by the model builder.
var field = function(required, validators){ return { required: required, validators: validators }; };
var required = function() { return field(true, Array.prototype.slice.call(arguments)); };
var optional = function() { return field(false, Array.prototype.slice.call(arguments)); };

// Ideally we'll want some way to specify required hierarchy -- `Assertion`s
// must contain `Badge`s, which must contain `Issuer`s. An model's validity
// would depend on the validity of all its children, and the specific errors
// from the children should bubble up, rather than just 'invalid badge', for
// example. For now, the global `validate` method handles this.
var Assertion = Model({
  recipient : required( email() ),
  evidence  : optional( url() ),
  expires   : optional( isodate() ),
  issued_on : optional( isodate() )
});
var Badge = Model({
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

// Given an assertion, collect errors from each model and and build a
// respose indicating success or failure with a complete list of errors. The
// errors object is keyed by the field with the error, the value is the error
// type. The field name is dot namespaced.
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
    errors: errors
  };
};
// Unrefined test for whether we are in node or in the browser.
if (typeof process !== 'undefined' && process.ENV) {
  exports.validate = validate;
  exports.isodate = isodate;
}
