var path = require('path');
exports.config = {
  protocol: 'http',
  hostname: '127.0.0.1',
  internal_port: '8888',
  external_port: '8888',
  
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
  }
}
