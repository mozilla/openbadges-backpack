
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
        backgroundColor: '#043C5E',
        siteLogo: 'data:image/png;base64,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',
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
