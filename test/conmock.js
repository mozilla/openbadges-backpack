var _ = require('underscore')
  , mime = require('mime')

conmock = function (fn, request, callback) {
  var mock = {};
  var request = _.defaults(request, {
    params: {},
    session: {},
    query: {},
    flash: function (){},
    param: function (key) { return this.params[key] }
  });
  
  var response = {
    headers: {},
    header: function (key, value) {
      if (value) return this.headers[key] = value;
      return this.headers[key];
    },
    contentType: function (type) {
      return this.header('Content-Type', mime.lookup(type));
    },
    send: function (data, status) {
      this.fntype = 'send';
      this.body = data;
      this.status = status || 200;
      this.request = request;
      callback(null, this);
    },
    json: function (data, status) {
      this.fntype = 'json';
      this.body = data;
      this.status = status;
      this.request = request;
      callback(null, this);
    },
    render: function (path, options) {
      options = options || {};
      this.fntype = 'render';
      this.path = path;
      this.status = options.status || 200;
      this.request = request;
      this.options = options;
      callback(null, this);
    },
  };
  function next () {
    response.fntype = 'next';
    callback(null, response);
  }
  return fn(request, response, next);
};

module.exports = conmock;