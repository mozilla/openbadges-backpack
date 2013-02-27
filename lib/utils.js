var conf = require('../lib/configuration');
/**
 * Fully qualify a relative URL using entries from the configuration
 *
 * @param {String} pathname
 * @return A fully qualified URL.
 */
var Utils = {};

Utils.fullUrl = function (pathname) {
  return require('url').format({
    protocol: conf.get('protocol'),
    hostname: conf.get('hostname'),
    port: conf.get('port'),
    pathname: pathname
  });
}

module.exports = Utils;