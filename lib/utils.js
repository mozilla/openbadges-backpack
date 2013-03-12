const _ = require('underscore');
const url = require('url');
const defaultConf = require('./configuration');

function isDefaultPort(protocol, port) {
  return (
    port === 'default'
    || (protocol === 'http' && port == 80)
    || (protocol === 'https' && port == 443)
  )
}

exports.determinePort = function determinePort(conf) {
  conf = conf || defaultConf;
  const protocol = conf.get('protocol');
  const port = conf.get('remote_port') || conf.get('port') || null;
  if (isDefaultPort(protocol, port))
    return null;
  return port;
};

exports.fullUrl = function fullUrl(pathname, conf) {
  conf = conf || defaultConf;
  const host = url.format({
    protocol: conf.get('protocol'),
    hostname: conf.get('hostname'),
    port: exports.determinePort(conf)
  });
  return url.resolve(host, pathname);
};

exports.extendUrl = function extendUrl(originalUrl, querystringArgs) {
  var parsed = url.parse(originalUrl, true);
  delete parsed.search;
  _.extend(parsed.query, querystringArgs);
  return url.format(parsed);
};
