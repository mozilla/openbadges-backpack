var path = require('path');
exports.config = {
  protocol: 'http',
  // hostname is important for authentication, if it doesn't match - 
  // backpack won't work.
  hostname: '127.0.0.1',
  internal_port: '8888',
  external_port: '8888',
  
  var_path: path.join(__dirname, '../../var'),
  
  // database configuration
  database: {
    driver: 'mongo',
    host: '127.0.0.1',
    port: '27017',
    name: 'obi'
  },
  
  // identity provider
  identity: {
    protocol: 'https',
    server: 'browserid.org:443',
    path: '/verify'
  }
}
