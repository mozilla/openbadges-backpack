const tap = require('tap').test;
const statsd = require(__dirname + '/../lib/statsd.js');

tap('statsd', function (t) {
  // Interface
  t.type(statsd, 'object', 'module should be a function');

  // Methods
  statsd.increment('test.bucket');
  statsd.decrement('test.bucket');

  // Force purge singleton
  t.end();
  setTimeout(process.exit, 100);
});