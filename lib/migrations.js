var path = require('path');
var migrate = require('db-migrate');
var mysql = require('./mysql');

module.exports = {
  dir: path.resolve(__dirname, '..', 'migrations'),
  up: function(options, callback) {
    if (arguments.length == 1) {
      callback = options;
      options = {};
    }
    options.config = options.config || mysql.getDatabaseConfig();
    options.count = options.count || Number.MAX_VALUE;
    migrate.connect(options.config, function(err, migrator) {
      if (err) throw err;
      migrator.migrationsDir = module.exports.dir;
      migrator.driver.createMigrationsTable(function(err) {
        if (err) throw err;
        migrator.up(options, function(err) {
          migrator.driver.close();
          callback(err);
        });
      });
    });
  },
  down: function(options, callback) {
    if (arguments.length == 1) {
      callback = options;
      options = {};
    }
    options.config = options.config || mysql.getDatabaseConfig();
    if (!options.destination && !options.count)
      options.count = 1;
    migrate.connect(options.config, function(err, migrator) {
      if (err) throw err;
      migrator.migrationsDir = module.exports.dir;
      migrator.driver.createMigrationsTable(function(err) {
        if (err) throw err;
        migrator.down(options, function(err) {
          migrator.driver.close();
          callback(err);
        });
      });
    });
  }
};
