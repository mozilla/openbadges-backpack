var config = require('./local').config
config.database.name += '_test';
exports.config = config;
