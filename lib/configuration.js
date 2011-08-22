var config = {},
    env = {};

exports.get = function(val) {
  if (val === 'env') return process.env['NODE_ENV'];
  return config[val];
}

env.local = {
  var_path: '../var',
  database: {
    driver: 'mongo',
    host: 'localhost'
  },
  identity: {
    protocol: 'https',
    server: 'browserid.org:443',
    path: '/verify'
  },
  hostname: 'hub.local'
}
env.prod = env.dev = env.local;

if (undefined === process.env['NODE_ENV']) {
  process.env['NODE_ENV'] = 'local';
}

config = env[process.env['NODE_ENV']];
if (config === undefined) throw "unknown environment: " + exports.get('env');
