var path = require('path');
exports.config = {
  protocol: 'http',
  hostname: '127.0.0.1',
  internal_port: '8888',
  external_port: '8888',
  
  var_path: path.join(__dirname, '../../var'),
  badge_path: path.join(__dirname, '../../static/_badges'),
  
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
  
  identity: {
    protocol: 'https',
    server: 'browserid.org:443',
    path: '/verify'
  }
}
