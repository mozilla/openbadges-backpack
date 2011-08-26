var path = require('path');
exports.config = {
  var_path: path.join(__dirname, '../../var'),
  database: {
    driver: 'mongo',
    host: '127.0.0.1',
    port: '27017',
    name: 'obi'
  },
  identity: {
    protocol: 'https',
    server: 'browserid.org:443',
    path: '/verify'
  },
  hostname: '127.0.0.1'
}
