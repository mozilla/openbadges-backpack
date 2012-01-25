var path = require('path');
exports.config = {
  protocol: 'http',
  // hostname is important for authentication, 
  // if it doesn't match the URL you're serving from,
  // backpack won't work.
  hostname: '127.0.0.1',
  internal_port: '8888',
  external_port: '8888',
  
  var_path: path.join(__dirname, '../../var'),
  badge_path: path.join(__dirname, '../../static/_badges'),
  
  // database configuration
  database: {
    nosql: {
      driver: 'mongo',
      host: '127.0.0.1',
      port: '27017',
      name: 'obi'
    },
    relational: {
      driver: 'mysql',
      host: '127.0.0.1',
      user: '',
      password: '',
      database: 'openbadges'
    }
  },
  
  // identity provider
  identity: {
    protocol: 'https',
    server: 'browserid.org:443',
    path: '/verify'
  }
}
