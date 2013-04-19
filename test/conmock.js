const _ = require('underscore');
const mime = require('mime');

/**
 * Mock a request to a handler.
 *
 * @asynchronous
 * @param {Object} options
 *   - handler: Request handler. Should accept `req`, `res`, and `next`.
 *   - request: Incoming request object.
 * @return {Error}
 * @return {Object}
 *   - The result of the attempted response.
 */

module.exports = function conmock (options, callback) {
  if (typeof options == 'function')
    options = { handler: options };
  const requestDefaults = {
    url: '',
    headers: {},
    params: {},
    session: {},
    query: {},
    flash: function (){},
    param: function (key) { return this.params[key] }
  };
  const handler = options.handler;
  const request = _.defaults(options.request || {}, requestDefaults);
  const mock = {
    headers: {},
    header: function (key, value) {
      if (value) return this.headers[key] = value;
      return this.headers[key];
    },
    setHeader: function (key, value) {
      return this.headers[key] = value;
    },
    contentType: function (type) {
      return this.header('Content-Type', mime.lookup(type));
    },
    type: function (type) {
      this.header('Content-Type', mime.lookup(type));
      return this;
    },
    send: function (data, status) {
      if (typeof data === 'number') {
        var tmp = data;
        data = status, status = tmp;
      }
      this.fntype = 'send';
      this.body = data;
      this.status = status || 200;
      callback(null, this, request);
    },
    json: function (data, status) {
      if (typeof data === 'number') {
        var tmp = data;
        data = status, status = tmp;
      }
      this.fntype = 'json';
      this.body = data;
      this.status = status;
      callback(null, this, request);
    },
    render: function (path, options) {
      options = options || {};
      this.fntype = 'render';
      this.path = path;
      this.status = options.status || 200;
      this.options = options;
      callback(null, this, request);
    },
    redirect: function (path, status) {
      if (typeof path === 'number') {
        var tmp = path;
        path = status, status = tmp;
      }
      this.fntype = 'redirect';
      this.path = path;
      this.status = status || 301;
      callback(null, this, request);
    },
  };
  mock.request = request;
  function next (err) {
    mock.fntype = 'next';
    mock.nextErr = err;
    callback(null, mock, request);
  }
  return handler(request, mock, next, options.param);
};
