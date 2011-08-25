var config = require('./local').config
config.database.db += '_test';
exports.config = config;
