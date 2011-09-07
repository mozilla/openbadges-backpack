#!/usr/bin/env node

// FIXME: make port a configuration rather than hardcoded.
var app = require('./app');
app.server.listen(80);
app.logger.info('READY PLAYER ONE');
