var _ = require('underscore')
var request = function (opts) {
  if (!(this instanceof arguments.callee))
    return new arguments.callee(opts)
  _.extend(this, opts);
  this.session = {
    _csrf: 'default-csrf',
    email: 'user@example.com'
  };
}
request.prototype.flash = function (type, message){};
var response = function (request, callback) {
  if (!(this instanceof arguments.callee))
    return new arguments.callee(request, callback)
  this.request = request;
  this.callback = callback;
  this.headers = {};
};
response.prototype.header = function (key, value) { this.headers[key] = value; };
response.prototype.render
  = response.prototype.redirect
  = response.prototype.send
  = response.prototype.json
  = function () {
    var args = [].slice.call(arguments);
    args.unshift({response: this, request: this.request});
    this.callback.apply(this, args);
  };
response.prototype.contentType = function (type) {
  this.header('content-type', type);
}

module.exports = {
  conn: {
    request: request,
    response: response
  }
}