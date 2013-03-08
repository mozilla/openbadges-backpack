module("Session");

test('Session.currentUser from meta', function() {
  ok(!Session().currentUser, "No current user");
  $('<meta http-equiv="X-Current-User" content="example@example.com">').appendTo($('body'));
  equal(Session().currentUser, 'example@example.com', "Current user grabbed from meta http-equiv=\"X-Current-User\"");
});

asyncTest('Session.login failure', function(){
  var s = Session({
    startLogin: function(deferred){
      // Always fail
      deferred.reject({userAbort: false});
    }
  });
  var started = false;
  s.on('login-started', function(){
    started = true;
  });
  s.on('login-error', function(){
    ok(started, 'Saw login-started');
    ok(true, 'Saw login-error');
    start();
  });
  s.on('login-complete', function(){
    ok(false, 'Saw login-complete');
    start();
  });
  s.login();
});

asyncTest('User abort', function(){
  var s = Session({
    startLogin: function(deferred){
      // Always abort
      deferred.reject({userAbort: true});
    }
  });
  var started = false;
  s.on('login-started', function(){
    started = true;
  });
  s.on('login-abort', function(){
    ok(started, 'Saw login-started');
    ok(true, 'Saw login-abort');
    start();
  });
  s.on('login-error', function(){
    ok(false, 'Saw login-error');
    start();
  });
  s.on('login-complete', function(){
    ok(false, 'Saw login-complete');
    start();
  });
  s.login();
});

asyncTest('Session.login success', function(){
  var s = Session({
    startLogin: function(deferred){
      // Always succeed
      deferred.resolve({email: 'foo@example.com'});
    }
  });
  var started = false;
  s.on('login-started', function(){
    started = true;
  });
  s.on('login-error', function(){
    ok(false, 'Saw login-error');
    start();
  });
  s.on('login-complete', function(){
    ok(started, 'Saw login-started');
    ok(true, 'Saw login-complete');
    equal(s.currentUser, 'foo@example.com', 'currentUser set');
    start();
  });
  s.login();
});

module("Badge");

asyncTest('Issuing a single badge', function(){
  var b = Badge('foo', {
    build: function(){ return $.Deferred().resolve(); },
    issue: function(){ return $.Deferred().resolve(); }
  });
  b.on('built', function(){
    this.issue();
  });
  b.done(function(){
    ok(true, 'done');
  });
  b.fail(function(){
    ok(false, 'fail');
  });
  b.always(function(){
    equal(this.state, 'complete');
    equal(this.assertion, 'foo');
    start();
  });
  b.build();
});

asyncTest('Badge fails build', function(){
  var b = Badge('foo', {
    build: function(){ return $.Deferred().reject('asplode'); }
  });
  b.on('built', function(){
    ok(false, 'should not see built event');
    start();
  });
  b.done(function(){
    ok(false, 'done');
  });
  b.fail(function(){
    ok(true, 'fail');
  });
  b.always(function(){
    equal(this.state, 'failed');
    deepEqual(this.error, {assertion: 'foo', reason: 'asplode'});
    start();
  });
  b.build();
});

asyncTest('Badge fails issue', function(){
  b = Badge('foo', {
    build: function(){ return $.Deferred().resolve(); },
    issue: function(){ return $.Deferred().reject('asplode'); }
  });
  var built = false;
  b.on('built', function(){
    built = true;
    b.issue();
  });
  b.done(function(){
    ok(fail, 'fail');
  });
  b.fail(function(){
    ok(true, 'fail');
  });
  b.always(function(){
    ok(built, 'saw built event');
    equal(this.state, 'failed');
    deepEqual(this.error, {assertion: 'foo', reason: 'asplode'});
    start();
  });
  b.build();
});

asyncTest('Badge rejected by user', function(){
  b = Badge('foo');
  b.on('built', function(){
    b.reject('DENIED');
  });
  b.done(function(){
    ok(false, 'done');
  });
  b.fail(function(){
    ok(true, 'fail');
  });
  b.always(function(){
    equal(this.state, 'failed');
    deepEqual(this.error, {assertion: 'foo', reason: 'DENIED'});
    start();
  });
  b.build();
});

asyncTest('Rejection reason and data', function(){
  b = Badge('foo', {
    build: function(){ return $.Deferred().resolve(); },
    issue: function(){ return $.Deferred().reject('asplode', {other: 'data', goes: 'here'}); }
  });
  b.on('built', function(){
    b.issue();
  });
  b.always(function(){
    deepEqual(this.error, {assertion: 'foo', reason: 'asplode', other: 'data', goes: 'here'});
    start();
  });
  b.build();
});

asyncTest('Successful badge state transitions', function(){
  var build = $.Deferred();
  var issue = $.Deferred();

  var b = Badge('foo', {
    build: function(){ return build; },
    issue: function(){ return issue; }
  });
  var states = [];
  states.push(b.state);
  b.on('built', function(){
    states.push(b.state);
    b.issue();
    states.push(b.state);
    issue.resolve();
  });
  b.on('issued', function(){
    states.push(b.state);
  });
  var stateChanges = 0;
  b.on('state-change', function(){
    stateChanges++;
  });
  b.always(function(){
    equal(stateChanges, 4);
    deepEqual(states, ['pendingBuild', 'built', 'pendingIssue', 'issued']);
    start();
  });
  b.build();
  build.resolve();
});

asyncTest('Badge built and issued events', function(){
  var b = Badge('foo');
  var events = [];
  b.on('built', function(){
    events.push('built');
    b.issue();
  });
  b.on('issued', function(){
    events.push('issued');
  });
  b.always(function(){
    deepEqual(events, ['built', 'issued'], 'saw both');
    start();
  });
  b.build();
});

asyncTest('badge.result() for issued', function(){
  var b = Badge('foo');
  b.on('built', function(){
    b.issue();
  });
  b.build();
  b.always(function(){
    equal(this.result(), 'foo');
    start();
  });
});

asyncTest('badge.result() for failed', function(){
  var b = Badge('foo', {
    build: function(){ return $.Deferred().reject('asplode', {more: 'stuff'}); }
  });
  b.build();
  b.always(function(){
    deepEqual(this.result(), {assertion: 'foo', reason: 'asplode'});
    start();
  });
});

asyncTest('Building badge data', function(){
  var b = Badge('foo', {
    build: function(assertionUrl){ return {assertion: assertionUrl, extra: 'stuff'}; }
  });
  equal(b.data, undefined);
  b.on('built', function(){
    deepEqual(b.data, {assertion: 'foo', extra: 'stuff'});
    start();
  });
  b.build();
});

asyncTest('Building badge data with deferred', function(){
  var b = Badge('foo', {
    build: function(assertionUrl){
      var build = $.Deferred();
      setTimeout(function(){
	build.resolve({assertion: assertionUrl, extra: 'stuff'});
      }, 500);
      return build;
    }
  });
  equal(b.data, undefined, 'no data before build');
  b.on('built', function(){
    deepEqual(b.data, {assertion: 'foo', extra: 'stuff'}, 'badgeData holds build');
    start();
  });
  b.build();
});

asyncTest('Building badge data and failing', function(){
  var b = Badge('foo', {
    build: function(assertionUrl){
      return $.Deferred().reject('reason', {error: 'data'}, {badge: 'data'});
    }
  });
  b.always(function(){
    deepEqual(b.error, {assertion: 'foo', reason: 'reason', error: 'data'});
    deepEqual(b.data, {badge: 'data'});
    start();
  });
  b.build();
});

asyncTest('Rejecting without badge data does not clobber', function(){
  var b = Badge('foo', {
    build: function(assertionUrl){
      return $.Deferred().resolve({some: 'data'})
    },
    issue: function(assertionUrl){
      return $.Deferred().reject('reason');
    }
  });
  b.on('built', function(){
    b.issue();
  });
  b.always(function(){
    deepEqual(b.data, {some: 'data'});
    deepEqual(b.error, {assertion: 'foo', reason: 'reason'});
    start();
  });
  b.build();
});

test('Checking badge state', function(){
  var b = Badge('foo');
  ok(b.inState('pendingBuild'));
  ok(b.inState('pendingBuild', 'somethingElse', 'maybeThis'));
  ok(b.inState('somethingFirst', 'pendingBuild', 'somethingElse', 'maybeThis'));
  ok(!b.inState('wrong'));
  ok(!b.inState('wrong', 'somethingElse', 'maybeThis'));
});

asyncTest('Failing a failed badge does nothing', function(){
  var b = Badge('foo', {
    build: function(assertionUrl){ return $.Deferred().reject('first'); }
  });
  b.fail(function(){
    deepEqual(b.result(), {assertion: 'foo', reason: 'first'});
    b.reject('second');
    deepEqual(b.result(), {assertion: 'foo', reason: 'first'});
    start();
  });
  b.build();
});


module("App");

/* A method to trivially fake success for build or issue */
function succeed(){
  return {};
}

/* Returns a method that will simulate build or issue failure on
   a single assertion url.
 */
function failOne(url, reason){
  return function(assertionUrl) {
    if (assertionUrl === url) {
      console.log('failing', assertionUrl);
      return $.Deferred().reject(reason);
    }
    console.log('passing', assertionUrl);
    return $.Deferred().resolve();
  };
}

/* A test helper to get result objects from a list of badges */
function results(list){
  return _.map(list, function(badge){ return badge.result(); });
}

asyncTest('Run app with no assertions', function(){
  var app = App([]);
  app.on('badges-complete', function(failures, successes, total){
    ok(true, 'badges-complete event');
    deepEqual(failures, [], 'empty failures');
    deepEqual(successes, [], 'empty successes');
    equal(total, 0, '0 total badges');
    start();
  });
  app.start();
});

asyncTest('Accept a single badge', function(){
  var app = App(['foo'], {
    build: succeed,
    issue: succeed
  });
  var ready = false;
  app.on('badges-ready', function(failures, badges){
    ready = true;
    equal(failures.length, 0);
    equal(badges.length, 1);
    equal(badges[0].assertion, 'foo');
    badges[0].issue();
  });
  var completeSeen = false;
  app.on('badges-complete', function(failures, successes, total){
    if (completeSeen)
      ok(false, 'badges-complete should only fire once');
    completeSeen = true;
    ok(ready, 'Saw badges-ready event');
    ok(true, 'badges-complete event');
    deepEqual(failures, [], 'empty failures');
    deepEqual(results(successes), ['foo'], 'foo a success');
    equal(total, 1, '1 total badges');
    start();
  });
  app.start();
});

asyncTest('Reject a single badge', function(){
  var app = App(['foo'], {
    build: succeed,
    issue: succeed
  });
  var ready = false;
  app.on('badges-ready', function(failures, badges){
    ready = true;
    equal(failures.length, 0);
    equal(badges.length, 1);
    equal(badges[0].assertion, 'foo');
    badges[0].reject('DENIED');
  });
  app.on('badges-complete', function(failures, successes, total){
    ok(ready, 'Saw badges-ready event');
    ok(true, 'badges-complete event');
    deepEqual(results(failures), [{assertion: 'foo', reason: 'DENIED'}], 'foo a failure');
    deepEqual(successes, [], 'empty successes');
    equal(total, 1, '1 total badges');
    start();
  });
  app.start();
});

asyncTest('Single badge fails build', function(){
  var app = App(['FAILME'], {
    build: failOne('FAILME', 'you suck')
  });
  var ready = false;
  app.on('badges-ready', function(failures, badges){
    ready = true;
    equal(failures.length, 1, 'one failure');
    deepEqual(results(failures), [{assertion: 'FAILME', reason: 'you suck'}], 'FAILME a failure');
  });
  app.on('badges-complete', function(failures, successes, total){
    ok(ready, 'saw ready event');
    deepEqual(results(failures), [{assertion: 'FAILME', reason: 'you suck'}], 'FAILME a failure');
    start();
  });
  app.start();
});

asyncTest('Single badge fails issue', function(){
  var app = App(['HAZIT'], {
    build: succeed,
    issue: failOne('HAZIT', 'you have that one')
  });
  var ready = false;
  app.on('badges-ready', function(failures, badges){
    ready = true;
    equal(badges.length, 1);
    badges[0].issue();
  });
  app.on('badges-complete', function(failures, successes, total){
    ok(ready, 'Saw badges-ready');
    deepEqual(results(failures), [{assertion: 'HAZIT', reason: 'you have that one'}], 'HAZIT a failure');
    start();
  });
  app.start();
});

asyncTest('Two badges - issue both', function(){
  var app = App(['foo', 'bar'], {
    build: succeed,
    issue: succeed
  });
  app.on('badges-ready', function(failures, badges){
    equal(badges.length, 2, 'two badges ready');
    badges.forEach(function(badge, i, arr){
      badge.issue();
    });
  });
  app.on('badges-complete', function(f, s, t){
    deepEqual(f, [], 'no failures');
    deepEqual(results(s), ['foo', 'bar'], 'both succeed');
    equal(t, 2);
    start();
  });
  app.start();
});

asyncTest('Two badges - one good, one bad', function(){
  var app = App(['foo', 'bar'], {
    build: failOne('bar', 'NO BARS!'),
    issue: succeed
  });
  var ready = false;
  app.on('badges-ready', function(failures, badges){
    ready = true;
    equal(badges.length, 1);
    equal(badges[0].assertion, 'foo');
    badges[0].issue();
  });
  app.on('badges-complete', function(f, s, t){
    ok(ready, 'saw ready event');
    deepEqual(results(f), [{assertion: 'bar', reason: 'NO BARS!'}], 'bar fails');
    deepEqual(results(s), ['foo'], 'foo succeeds');
    equal(t, 2);
    start();
  });
  app.start();
});

asyncTest('Two badges - both fail', function(){
  var app = App(['foo', 'bar'], {
    build: failOne('bar', "bar won't build"),
    issue: failOne('foo', "foo won't issue")
  });
  app.on('badges-ready', function(failures, badges){
    badges.forEach(function(badge){
      badge.issue();
    });
  });
  app.on('badges-complete', function(f, s, t){
    deepEqual(results(f), [{assertion: 'foo', reason: "foo won't issue"}, {assertion: 'bar', reason: "bar won't build"}]);
    deepEqual(results(s), []);
    equal(t, 2);
    start();
  });
  app.start();
});

asyncTest('Abort after app.start()', function(){
  var app = App(['foo', 'bar', 'baz'], {
    build: function(assertionUrl){
      var d = $.Deferred();
      if (assertionUrl === 'foo')
	setTimeout(function(){ d.resolve(); }, 500);
      else if (assertionUrl === 'bar')
	d.reject('failed build');
      else if (assertionUrl === 'baz')
	setTimeout(function(){ d.reject('fail later'); }, 500);
      return d;
    }
  });
  app.on('badges-complete', function(){
    ok(false, 'should not complete');
    start();
  });
  app.on('badges-aborted', function(f, s, t){
    deepEqual(results(f), [
      {assertion: 'foo', reason: 'DENIED'},
      {assertion: 'bar', reason: 'failed build'},
      {assertion: 'baz', reason: 'DENIED'}
    ]);
    start();
  });
  app.start();
  app.abort();
});

asyncTest('Abort before app.start()', function(){
  var app = App(['foo', 'bar', 'baz']);
  app.on('badges-complete', function(){
    ok(false, 'should not complete');
    start();
  });
  app.on('badges-aborted', function(f, s, t){
    deepEqual(results(f), [
      {assertion: 'foo', reason: 'DENIED'},
      {assertion: 'bar', reason: 'DENIED'},
      {assertion: 'baz', reason: 'DENIED'}
    ]);
    start();
  });
  app.abort();
});

asyncTest('Using badges-failed event', function(){
  var app = App(['foo', 'bar'], {
    build: failOne('foo', 'bad build'),
    issue: failOne('bar', 'bad issue')
  });
  var failed = 0;
  var expected = {
    'foo': { reason: 'bad build' },
    'bar': { reason: 'bad issue' }
  };
  app.on('badge-failed', function(badge){
    failed++;
    equal(badge.error.reason, expected[badge.assertion].reason, 'reason good');
  });
  app.on('badges-ready', function(f, badges){
    badges.forEach(function(badge){
      badge.issue();
    });
  })
  app.on('badges-complete', function(f, s, t){
    equal(failed, 2, 'saw two failure events');
    equal(f.length, 2, 'receive both as failures');
    start();
  });
  app.start();
});
