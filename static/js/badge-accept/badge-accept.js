
jQuery.extend({
  meta: function(name, value) {
    return $("meta[http-equiv='" + name + "']").attr("content", value);
  }
});

/* Session - an evented login & session helper
 *  Optionally takes startLogin method in a spec object
 *    to override default login implementation
 */
var Session = function Session(spec) {
  spec = spec || {};

  var startLogin = spec.startLogin || function(login) {
    /* default login implementation uses Persona */
    navigator.id.get(
      function(assertion) {
        if (assertion) {
          jQuery.ajax({
            url: '/backpack/authenticate',
            type: 'POST',
            dataType: 'json',
            data: {assertion: assertion},
            success: function(data) {
              login.resolve(data);
            },
            error: function() {
              login.reject({userAbort: false});
            }
          });
        }
        else {
          login.reject({userAbort: true});
        }
      },
      {
        siteName: 'Mozilla Backpack',
        termsOfService: '/tou.html',
        privacyPolicy: '/privacy.html',
        returnTo: '/issuer/welcome'
      }
    );
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
        login.fail(function(data) {
          if (data.userAbort)
            Session.trigger("login-abort");
          else
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

  jQuery.ajaxSetup({
    beforeSend: function (xhr, settings) {
      if (!settings.crossDomain && settings.type != "GET")
        xhr.setRequestHeader('X-CSRF-Token', Session.CSRF)
    }
  });

  _.extend(Session, Backbone.Events);

  return Session;
};

/* Badge - represents a badge in the acceptance workflow
 *   Takes an assertion, either url or signature
 *   Optionally takes build and issue methods in a spec object
 *     These should return Deferreds (or plain objects, which count
 *        as a resolved Deferred)
 *     `build` attempts to build a full badge out of the assertion url
 *     `issue` attempts to issue the badge
 *
 *   The Deferred is resolved if build and issue succeed, and rejected
 *   if either has an error or the badge is rejected by the user.
 */
var Badge = function Badge(assertion, spec) {
  spec = spec || {};
  var _build = spec.build || function() { return {}; };
  var _issue = spec.issue || function() { return {}; };

  var buildState;
  var issueState;

  var Badge = jQuery.Deferred(function() {
    this.state = 'pendingBuild';

    function changeState(to) {
      Badge.state = to;
      Badge.trigger('state-change', to);
    }

    this.assertion = assertion;

    /* If the badge is rejected, error contains the assertion, reason,
       and any additional data for the failure. */
    this.fail(function(reason, data) {
      this.error = _.extend({assertion: assertion, reason: reason}, data);
      changeState('failed');
    });

    /* If the badge is resolved, it moves to state complete. */
    this.done(function() {
      changeState('complete');
    });

    /* Kicks off building of the badge. */
    this.build = function build() {
      buildState = _build(assertion);

      jQuery.when(buildState).then(
        function buildSuccess(data) {
          Badge.data = data;
          changeState('built');
          Badge.trigger('built');
        },
        function buildFailure(reason, errorData, badgeData) {
          Badge.data = badgeData;
          Badge.reject(reason, errorData);
        }
      );
    };

    /* Kicks off issuing the badge. */
    this.issue = function issue() {
      if (this.state != 'built')
	      throw new Error('Cannot issue unbuilt badge');

      changeState('pendingIssue');
      issueState = _issue.call(this, assertion);

      jQuery.when(issueState).then(
        function issueSuccess() {
          changeState('issued');
          Badge.trigger('issued');
          Badge.resolve();
        },
        function issueFailure(reason, data) {
          Badge.reject(reason, data);
        }
      );
    };

    /* .result is the final "view" of the badge that gets returned
       to the OpenBadges.issue() callback. */
    this.result = function result() {
      if (this.inState('issued', 'complete'))
	      return this.assertion;
      else if (this.inState('failed'))
	      return { assertion: this.error.assertion, reason: this.error.reason };
      else
	      throw new Error("Can't return result for state " + this.state);
    };

    /* Query if badge is in any of the given states */
    this.inState = function inState() {
      return _.include(arguments, this.state);
    }

    _.extend(this, Backbone.Events);

  });

  return Badge;
};

/* App - watches a collection of badges and emits checkpoint
 *    events as they move through acceptance workflow
 *
 *   Takes a list of assertions (either urls or signatures)
 *   Optionally takes build and issue methods in a spec object
 *      see Badge
 */
var App = function App(assertions, spec) {
  assertions = assertions || [];
  spec = spec || {};

  /* Default build implementation is the "real" one. */
  var build = spec.build || function(assertion) {
    var build = jQuery.Deferred();
    jQuery.ajax({
      url: '/issuer/assertion',
      data: {
        assertion: assertion
      },
      success: function(obj) {
        if (obj.exists) {
          build.reject('EXISTS', {}, obj);
        }
        else if (!obj.owner) {
          build.reject('INVALID', {}, obj);
        }
        else {
          build.resolve(obj);
        }
      },
      error: function(xhr, textStatus, error) {
        var message;
        try {
          /* If the ajax call was good but the server returned an error
             from its call, responseText will be a json object. */
          var err = jQuery.parseJSON(xhr.responseText);
          message = err.message;
        }
        catch (ex) {
          /* Otherwise our ajax call itself failed. */
          message = "Internal error; please try again later.";
        }
        /* FIXME: INACCESSIBLE is really only appropriate for the case
           within the try block. */
        build.reject('INACCESSIBLE', { message: message });
      }
    });
    return build;
  };

  /* Default issue implementation is the "real" one used by
     the issuer frame. */
  var issue = spec.issue || function(assertion) {
    var issue = jQuery.Deferred();
    var self = this;
    var post = jQuery.ajax({
      type: 'POST',
      url: '/issuer/assertion',
      data: {
	      assertion: assertion
      },
      success: function(data, textStatus, jqXHR) {
        if (jqXHR.status == 304) {
          issue.reject('EXISTS');
        } else
          issue.resolve();
      },
      error: function(req) {
        /* FIXME: INVALID may not be appropriate here, particularly if
           the ajax call itself failed. */
        issue.reject('INVALID');
      }
    });
    return issue;
  };

  var badges = [];
  var aborted = false;

  assertions.forEach(function(assertion) {
    var b = Badge(assertion, {
      build: build,
      issue: issue
    });

    /* Pass along badge state changes, as well as
       calling out failures. */
    b.on('state-change', function(to) {
      if (to === 'failed') {
        App.trigger('badge-failed', b);
      }
      App.trigger('state-change', b, to);
    });

    badges.push(b);
  });

  var App = {

    /* Begins processing all the badges and emitting events. */
    start: function() {
      if (assertions.length === 0) {
        App.trigger('badges-complete', [], [], 0);
      }
      else {
        badges.forEach(function(badge, i, arr) {
          badge.build();
	      });
      }
    },

    /* Aborts all badges, DENYing those that haven't yet failed. */
    abort: function() {
      aborted = true;
      badges.forEach(function(badge) {
        badge.reject('DENIED');
      });
    }
  };

  _.extend(App, Backbone.Events);

  /* Helper to get all badges in given states. */
  function getAllIn() {
    var states = Array.prototype.slice.apply(arguments);
    var results = _.filter(badges, function(badge) {
      return badge.inState.apply(badge, states);
    });
    return results;
  }

  /* Checks for notification that all badges have built or failed. */
  function checkAllBuilt() {
    var building = _.find(badges, function(badge) {
      return badge.inState('pendingBuild');
    });
    if (!building) {
      var built = _.filter(badges, function(badge) {
        return badge.inState('built');
      });
      var failures = getAllIn('failed');
      App.off('state-change', checkAllBuilt);
      App.trigger('badges-ready', failures, built);
    }
  }

  /* Checks for notification that all badges have been issued,
     rejected or failed. */
  function checkAllIssued() {
    var nonFinal = _.find(badges, function(badge) {
      return !badge.inState('issued', 'failed', 'complete');
    });
    if (!nonFinal) {
      var issuedCount = _.reduce(badges, function(memo, badge) {
        return badge.inState('issued', 'complete') ? memo + 1 : memo;
      }, 0);
      App.trigger('badges-issued', issuedCount);
    }
  }

  /* Checks that all badges are in a final state, complete or failed. */
  var complete = false;
  function checkAllDone() {
    if (complete)
      return;

    var pending = _.find(badges, function(badge) {
      return !badge.inState('failed', 'complete');
    });
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
