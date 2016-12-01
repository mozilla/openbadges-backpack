var config = require('./local').config
config.database.database += '_test';
exports.config = config;
