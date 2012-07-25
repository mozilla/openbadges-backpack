
jQuery.extend({
  meta: function(name, value) {
    return $("meta[http-equiv='" + name + "']").attr("content", value);
  }
});

var Session = function(spec) {
  var spec = spec || {};

  var startLogin = spec.startLogin || function(login) {
    navigator.id.getVerifiedEmail(function(assertion) {
      jQuery.ajax({
	url: '/backpack/authenticate',
	type: 'POST',
	dataType: 'json',
	data: {assertion: assertion},
	success: function(data) {
	  login.resolve(data);
	},
	error: function() {
	  login.reject();
	}
      });
    });
  };

  var loginStarted = false;
  var Session = {
    CSRF: jQuery.meta("X-CSRF-Token"),
    currentUser: jQuery.meta("X-Current-User"),
    login: function() {
      if (!loginStarted) {
	var login = jQuery.Deferred();
	login.done(function(data) {
	  Session.currentUser = data.email;
	  Session.trigger("login-complete");
	});
	login.fail(function() {
	  Session.trigger("login-error");
	});
	login.always(function() {
	  loginStarted = false;
	});
	loginStarted = true;
	Session.trigger('login-started');
	startLogin(login);
      }
    }
  };

  _.extend(Session, Backbone.Events);

  jQuery.ajaxSetup({
    beforeSend: function (xhr, settings) {
      if (!settings.crossDomain && settings.type != "GET")
	xhr.setRequestHeader('X-CSRF-Token', Session.CSRF)
    }
  });

  return Session;
};

/* Badge - an evented Deferred representing a badge
 *   Takes an assertion url
 *   Optionally takes build and issue methods in a spec object
 *     These should return Deferreds or plain objects
 *     `build` attempts to build a full badge out of the assertion url
 *     `issue` attempts to issue the badge
 *
 *   Events:
 *     built   - fired when build succeeds
 *     issued  - fired when issue succeeds
 *
 *   The Deferred is resolved if build and issue succeed, and rejected
 *   if either has an error or the badge is rejected by the user.
 */
var Badge = function(assertion, spec){
  var spec = spec || {};
  var build = spec.build || function(){ return {}; };
  var issue = spec.issue || function(){ return {}; };

  var buildState;
  var issueState;

  var Badge = $.Deferred(function(){
    var _state = 'pendingBuild';
    var _badgeData;

    function changeState(to){
      _state = to;
      Badge.trigger('state-change', to);
    }

    this.assertion = assertion;

    this.error;
    this.fail(function(reason, data){
      this.error = _.extend({url: assertion, reason: reason}, data) ;
      changeState('failed');
    });

    this.done(function(){
      changeState('complete');
    });

    this.start = function(){
      buildState = build(assertion);

      $.when(buildState).then(
	function buildSuccess(data){
	  _badgeData = data;
	  changeState('built');
	  Badge.trigger('built');
	},
	function buildFailure(reason, errorData, badgeData){
	  _badgeData = badgeData;
	  Badge.reject(reason, errorData);
	}
      );
    };

    this.issue = function(){
      if (_state != 'built')
	throw new Error('Cannot issue unbuilt badge');

      changeState('pendingIssue');
      issueState = issue.call(this, assertion);

      $.when(issueState).then(
	function issueSuccess(){
	  changeState('issued');
	  Badge.trigger('issued');
	  Badge.resolve();
	},
	function issueFailure(reason, data){
	  Badge.reject(reason, data);
	}
      );
    };

    this.badgeData = function(){
      return _badgeData;
    };

    this.result = function(){
      if (this.inState('issued', 'complete'))
	return this.assertion;
      else if (this.inState('failed'))
	return this.error;
      else
	throw new Error("Can't return result for state " + this.state());
    };

    this.state = function(){
      return _state;
    };

    this.inState = function(){
      return _.include(arguments, this.state());
    }

    _.extend(this, Backbone.Events);

  });

  return Badge;
};

var App = function(assertions, spec){
  var assertions = assertions || [];
  var spec = spec || {};

  var build = spec.build || function(assertion){
    var build = $.Deferred();
    jQuery.ajax({
      url: '/issuer/assertion',
      data: {
	url: assertion
      },
      success: function(obj){
      var issuedBadge = obj.badge;
      var badgeData = obj.badge.badge;
	if (obj.exists) {
	  build.reject('EXISTS', {}, badgeData);
	}
	else if (!obj.owner) {
	  build.reject('INVALID', {owner: false}, badgeData);
	}
	else {
	  build.resolve(issuedBadge);
	}
      },
      error: function(err){
	// TODO: is this the right error?
	build.reject('INACCESSIBLE', { message: err.statusText });
      }
    });
    return build;
  };

  var issue = spec.issue || function(assertion){
    var issue = $.Deferred();
    var self = this;
    var post = jQuery.ajax({
      type: 'POST',
      url: '/issuer/assertion',
      data: {
	url: assertion
      },
      success: function(data, textStatus, jqXHR) {
	if (jqXHR.status == 304) {
	  issue.reject('EXISTS');
	} else
	  issue.resolve();
      },
      error: function(req) {
	issue.reject('INVALID', {owner: true});
      }
    });
    return issue;
  };

  var badges = [];
  var aborted = false;

  assertions.forEach(function(assertion, i, arr){
    var b = Badge(assertion, {
      build: build,
      issue: issue
    });
    b.on('state-change', function(to){
      if (to === 'failed'){
	App.trigger('badge-failed', b);
      }
      App.trigger('state-change', b, to);
    });
    badges.push(b);
  });

  var App = {
    start: function(){
      if (assertions.length === 0) {
	App.trigger('badges-complete', [], [], 0);
      }
      else {
	badges.forEach(function(badge, i, arr){
	  badge.start();
	});
      }
    },
    abort: function(){
      aborted = true;
      badges.forEach(function(badge){
	badge.reject('DENIED');
      });
    }
  };

  _.extend(App, Backbone.Events);

  function getAllIn() {
    var states = Array.prototype.slice.apply(arguments);
    var results = _.filter(badges, function(badge){ return badge.inState.apply(badge, states); });
    return results;
  }

  function checkAllBuilt() {
    var building = _.find(badges, function(badge){ return badge.inState('pendingBuild'); });
    if (!building){
      var built = _.filter(badges, function(badge){ return badge.inState('built'); });
      var failures = getAllIn('failed');
      App.off('state-change', checkAllBuilt);
      App.trigger('badges-ready', failures, built);
    }
  }

  function checkAllIssued() {
    var nonFinal = _.find(badges, function(badge){ return !badge.inState('issued', 'failed', 'complete'); });
    if (!nonFinal) {
      var issuedCount = _.reduce(badges, function(memo, badge){ return badge.inState('issued', 'complete') ? memo + 1 : memo; }, 0);
      App.trigger('badges-issued', issuedCount);
    }
  }

  var complete = false;
  function checkAllDone() {
    if (complete)
      return;

    var pending = _.find(badges, function(badge){ return !badge.inState('failed', 'complete'); });
    if(!pending) {
      complete = true;
      var failures = getAllIn('failed');
      var successes = getAllIn('complete');
      App.off('state-change', checkAllDone);
      var evt = aborted ? 'badges-aborted' : 'badges-complete';
      App.trigger(evt, failures, successes, badges.length);
    }
  }

  App.on('state-change', checkAllBuilt);
  App.on('state-change', checkAllIssued);
  App.on('state-change', checkAllDone);

  return App;
};
