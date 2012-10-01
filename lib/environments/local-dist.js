var path = require('path');
exports.config = {
  // either http or https
  protocol: 'http',

  // hostname is important for authentication,
  // if it doesn't match the URL you're serving from,
  // backpack won't work.
  hostname: 'localhost',

  // When constructing absolute URLs, this port will be appended to the host
  // This can be different from the internal port if you have a proxy in front
  // of node.
  port: '8888',

  // Various files related to cookie management and other things are saved here.
  var_path: path.join(__dirname, '../../var'),

  // Where to cache badge images from the issued badges
  badge_path: path.join(__dirname, '../../static/_badges'),

  // Administrators, users with these accounts can access certain pages
  admins: ['example@example.com'],

  // Database configuration
  // Make sure to create a user that has full privileges to the database
  database: {
    driver: 'mysql',
    host: '127.0.0.1',
    user: 'badgemaker',
    password: 'secret',
    database: 'openbadges'
  },

  // BrowserID verifier location.
  // You almost certainly shouldn't need to change this.
  identity: {
    protocol: 'https',
    server: 'verifier.login.persona.org',
    path: '/verify'
  }
}
