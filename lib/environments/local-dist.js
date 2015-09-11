var path = require('path');
exports.config = {
  // either http or https
  protocol: 'http',

  // external hostname of the server.
  hostname: 'localhost',

  // When starting the application with `node app.js`, this is the port
  // that the application will try to bind to. When remote_port is *not*
  // set, this will also be used to construct fully qualified urls to
  // application resources
  port: process.env.PORT || 8888,

  // Should the server redirect all http requests to https?
  force_https: false,

  // If you are running the application behind a proxy or load
  // balancer, this should be set the externally accessible port.
  // You can use the string 'default' to use the default port for
  // your specified protocol. This is primarily used when constructing
  // fully qualified urls to resources served by the application.
  // remote_port: 'default',

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
    host: process.env.DATABASE_HOST || '127.0.0.1',
    user: process.env.DATABASE_USER || 'badgemaker',
    password: process.env.DATABASE_PASS || 'secret',
    database: process.env.DATABASE_NAME || 'openbadges'
  },

  // Statsd configuration
  // see https://github.com/sivy/node-statsd#usage for additional config options
  statsd: {
    host: '0.0.0.0',
    port: 8125
  },

  // BrowserID verifier location.
  // You almost certainly shouldn't need to change this.
  identity: {
    protocol: 'https',
    server: 'verifier.login.persona.org',
    path: '/verify'
  },

  // LESS/CSS compilation settings
  // Additional options: https://github.com/emberfeather/less.js-middleware#options
  // Recommended PRODUCTION settings:
  //   less: {
  //     once: true,
  //     compress: true,
  //     force: false
  //   }
  less: {
    once: false,
    compress: "auto",
    force: true
  },

  // Nunjucks settings
  // More info: http://nunjucks.jlongster.com/api#Using-Nunjucks-in-the-Browser
  // Compilation of templates must be handled externally; see `bin/template-precompile`
  nunjucks_precompiled: false

}
