var _ = require('underscore')

var request = function (opts) {
  if (!(this instanceof arguments.callee)) return new arguments.callee(opts);
  _.extend(this, opts);
  this.params = {};
  this.query = {};
  this.session = {
    _csrf: 'default-csrf',
    email: 'user@example.com'
  };
}
request.prototype.param = function (key) {
  return this.params[key];
};
request.prototype.flash = function (type, message){};


var response = function (request, callback) {
  if (!(this instanceof arguments.callee)) {
    console.log('this should never happen');
    return new arguments.callee(request, callback);
  }
  this.request = request;
  this.callback = callback;
  this.headers = {};
};
response.prototype.header = function (key, value) {
  return (this.headers[key] = value);
};
response.prototype.contentType = function (type) {
  return this.header('content-type', type);
}
response.prototype.render
  = response.prototype.redirect
  = response.prototype.send
  = response.prototype.json
  = function () {
    var args = [].slice.call(arguments);
    args.unshift({response: this, request: this.request});
    this.callback.apply(this, args);
  };


module.exports = {
  conn: {
    request: request,
    response: response
  }
}