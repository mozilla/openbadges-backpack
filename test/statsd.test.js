const tap = require('tap').test;
const sinon = require('sinon');
const statsd = require(__dirname + '/../lib/statsd.js');

tap('statsd', function (t) {
  // Interface
  t.type(statsd, 'object', 'module should be a function');

  // Methods
  statsd.increment('test.bucket');
  statsd.decrement('test.bucket');

  t.test('middleware', function (t) {
    const middleware = require('../middleware').statsdRequests();
    sinon.spy(statsd, 'increment');

    middleware({ 
      path: '/some/path',
      method: 'METHOD'
    }, {}, function(){
      t.ok(statsd.increment.calledOnce, 'increment called');
      t.deepEqual(statsd.increment.args[0], ['paths.some.path.method']);
      sinon.restore();
      t.end();
    });
  });

  // Force purge singleton
  t.end();
  setTimeout(process.exit, 100);
});