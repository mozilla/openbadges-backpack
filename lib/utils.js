var url = require('url');
var _ = require('underscore');
var conf = require('./configuration');

/**
 * Fully qualify a relative URL using entries from the configuration
 *
 * @param {String} pathname
 * @return A fully qualified URL.
 */
var Utils = {};

Utils.fullUrl = function fullUrl(pathname) {
  var port = conf.get('remote_port') || conf.get('port') || null;
  if (port === 'default')
    port = null;
  var base = url.format({
    protocol: conf.get('protocol'),
    hostname: conf.get('hostname'),
    port: port
  });
  return url.resolve(base, pathname);
};

Utils.extendUrl = function extendUrl(originalUrl, querystringArgs) {
  var parsed = url.parse(originalUrl, true);
  delete parsed.search;
  _.extend(parsed.query, querystringArgs);
  return url.format(parsed);
};

module.exports = Utils;