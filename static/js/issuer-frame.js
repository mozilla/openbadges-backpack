// TODO: Make sure we display the origin of the issuer (parent frame).

_.templateSettings = {
  escape : /\[\[(.+?)\]\]/g
};

jQuery.extend({
  meta: function(name, value) {
    return $("meta[http-equiv='" + name + "']").attr("content", value);
  }
});

jQuery.fn.extend({
  render: function(args) {
    var template = _.template(this.html());
    return $(template(args));
  }
});

var Testing = (function setupTestingEnvironment() {
  if (window.parent !== window)
    return;

  var Testing = {
    browseridWorks: true,
    instantTransitions: function() {
      var DELAY_MS = 10;
      function scheduleCallback(cb, self) {
        if (cb)
          setTimeout(function() {
            cb.call(self);
          }, DELAY_MS);
      }
      function quickShow(cb) {
        this.show();
        scheduleCallback(cb, this);
      }
      function quickHide(cb) {
        this.hide();
        scheduleCallback(cb, this);
      }
      jQuery.fn.extend({
        fadeIn: quickShow,
        fadeOut: quickHide,
        slideDown: quickShow,
        slideUp: quickHide
      });
    }
  };
  
  var FAKE_XHR_DELAY = 10;
  var ASSERTIONS = [
    "http://foo.org/newbadge.json",
    "http://foo.org/another_newbadge.json",
    "http://foo.org/nonexistent.json",
    "http://bar.org/oldbadge.json",
    "http://foo.org/makebackpackexplode.json"
  ];
  var RESPONSES = {
    "http://foo.org/makebackpackexplode.json": {
      owner: false,
      exists: false,
      badge: {
        "recipient": "someone_else@example.com",
        "evidence": "/badges/html9-basic/example",
        "badge": {
          "version": "0.5.0",
          "name": "HTML9 Fundamental",
          "image": "/_demo/nc.large.png",
          "description": "Fetchable and validates fine client-side but not server-side",
          "criteria": "/badges/html9-basic",
          "issuer": {
            "origin": "http://p2pu.org",
            "name": "P2PU",
            "org": "School of Webcraft",
            "contact": "admin@p2pu.org"
          }
        }
      }
    },
    "http://foo.org/newbadge.json": {
      owner: true,
      exists: false,
      badge: {
        "recipient": "example@example.com",
        "evidence": "/badges/html5-basic/example",
        "badge": {
          "version": "0.5.0",
          "name": "HTML5 Fundamental",
          "image": "/_demo/by.large.png",
          "description": "Knows the difference between a <section> and an <article>",
          "criteria": "/badges/html5-basic",
          "issuer": {
            "origin": "http://p2pu.org",
            "name": "P2PU",
            "org": "School of Webcraft",
            "contact": "admin@p2pu.org"
          }
        }
      }
    },
    "http://foo.org/another_newbadge.json": {
      owner: true,
      exists: false,
      badge: {
        "recipient": "example@example.com",
        "evidence": "/badges/html6-basic/example",
        "badge": {
          "version": "0.5.0",
          "name": "HTML6 Fundamental",
          "image": "/_demo/cc.large.png",
          "description": "Knows the difference between a <sprite> and a <hamster>",
          "criteria": "/badges/html6-basic",
          "issuer": {
            "origin": "http://p2pu.org",
            "name": "P2PU",
            "org": "School of Webcraft",
            "contact": "admin@p2pu.org"
          }
        }
      }
    },
    "http://bar.org/oldbadge.json": {
      owner: true,
      exists: true,
      badge: {
        "recipient": "example@example.com",
        "evidence": "/badges/html4-basic/example",
        "badge": {
          "version": "0.5.0",
          "name": "HTML4 Fundamental",
          "image": "/_demo/cc.large.png",
          "description": "Knows the difference between a <p> and an <b>",
          "criteria": "/badges/html4-basic",
          "issuer": {
            "origin": "http://p2pu.org",
            "name": "P2PU",
            "org": "School of Webcraft",
            "contact": "admin@p2pu.org"
          }
        }
      }
    }
  };

  function show(text) {
    var div = $('<pre style="whitespace: pre-wrap"></pre>');
    div.text(text);
    $("#test-info .log").prepend(div);
    div.hide().slideDown();
  }
  
  var fakeResponseHandlers = {
    "POST /backpack/authenticate": function(options, cb) {
      if (Testing.browseridWorks)
        cb(200, 'OK', {
          json: {
            email: options.data.assertion
          }
        });
      else
        cb(400, 'Bad Request');
    },
    "POST /issuer/assertion": function(options, cb) {
      if (options.data.url == "http://foo.org/makebackpackexplode.json")
        cb(400, 'Bad Request', {
          text: JSON.stringify({
            message: "blah"
          })
        });
      else
        cb(200, 'OK');
    },
    "GET /issuer/assertion": function(options, cb) {
      if (options.data.url in RESPONSES) {
        cb(200, 'OK', {json: RESPONSES[options.data.url]});
      } else
        cb(404, 'Not Found');
    }
  };
  
  jQuery.meta("X-Current-User", "example@example.com");
  jQuery.ajaxTransport("+*", function(options, originalOptions, jqXHR) {
    return {
      send: function(headers, completeCallback) {
        setTimeout(function() {
          var string = options.type + " " + originalOptions.url;
          if (string in fakeResponseHandlers) {
            fakeResponseHandlers[string]({
              data: originalOptions.data
            }, completeCallback);
          } else {
            completeCallback(404, 'Not Found');
          }
          //console.log("ajax", options.type, originalOptions.url, options, originalOptions, headers);
        }, FAKE_XHR_DELAY);
      },
      abort: function() {
        throw new Error("abort() is not implemented!");
      }
    };
  });
  
  $(window).ready(function() {
    window.issue(ASSERTIONS, function(errors, successes) {
      show("If this page were not in test mode, it would close now, " +
           "and the following information would be passed back " +
           "to the parent frame.\n\n" + 
           "errors:\n\n" + JSON.stringify(errors, null, " ") +
           "\n\nsuccesses:\n\n" + JSON.stringify(successes, null, " "));
    });
    $("#test-info").show();
    show("The simulated assertions passed to this page are:\n\n " +
         JSON.stringify(ASSERTIONS, null, " "));
  });
  if (!navigator.id)
    navigator.id = {};
  navigator.id.getVerifiedEmail = function(cb) {
    var email = "someone_else@example.com";
    show("We just simulated a BrowserID login of " + email + ".");
    cb(email);
  };  
  return Testing;
})();

var Session = (function() {
  var loginStarted = false;
  var Session = {
    CSRF: jQuery.meta("X-CSRF-Token"),
    currentUser: jQuery.meta("X-Current-User"),
    login: function() {
      if (!loginStarted) {
        navigator.id.getVerifiedEmail(function(assertion) {
          jQuery.ajax({
            url: '/backpack/authenticate',
            type: 'POST',
            dataType: 'json',
            data: {assertion: assertion},
            success: function(data) {
              Session.currentUser = data.email;
              Session.trigger("login-complete");
            },
            error: function() {
              Session.trigger("login-error");
            },
            complete: function() {
              loginStarted = false;
            }
          });
        });
        loginStarted = true;
        Session.trigger('login-started');
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
})();

function showBadges() {
  $("#welcome").fadeOut(Assertions.processNext);
}

$(window).ready(function() {
  var activeRequests = 0;
  
  $("#ajax-loader").ajaxSend(function() {
    $(this).fadeIn();
    activeRequests++;
  }).ajaxComplete(function() {
    if (--activeRequests == 0)
      $(this).fadeOut();
  });
  
  if (!Session.currentUser) {
    $(".logged-out").show();
    $(".logged-out .js-browserid-link").click(function() {
      Session.login();
      return false;
    });
  } else {
    $(".logged-in").show();
    $(".logged-in .next").click(showBadges);
    $(".logged-in .email").text(Session.currentUser);
    $(".logged-in .logout").click(function() {
      $(".logged-in .next").unbind("click");
      Session.login();
      return false;
    });
  }

  Session.on("login-error", function() {
    showError("#login-error-template");
  });
  Session.on("login-complete", showBadges);
  $(".host").text(window.location.host);
  
  var channel = buildChannel();
});

function showError(templateName, args) {
  $(templateName).render(args).appendTo("#messages").hide().slideDown();
}

// This is the core issuing implementation; the response is proxied
// back to the parent window. The function is global so it can be
// overridden from testing suites.
function issue(assertions, cb) {
  $("#welcome").fadeIn();
  var errors = [];
  var successes = [];
  window.Assertions = {
    processNext: function() {
      if (assertions.length == 0) {
        function exit() {
          // We're on our way out. Disable all event handlers on the page,
          // so the user can't do anything.
          $("button, a").unbind();
          cb(errors, successes);
        }
        if ($("#welcome:visible").length) {
          exit();
          return;
        }
        if (successes.length < 2)
          $("#farewell .badges-" + successes.length).show();
        else {
          $("#farewell .badges-many").show();
          $("#farewell .badges-added").text(successes.length);
        }
        $("#farewell .next").click(exit);
        $(".navbar .closeFrame").unbind().click(exit);
        $("#farewell").fadeIn();
        return;
      }
      var url = assertions.pop();
      // TODO: parse the URL to see if it's malformed.
      jQuery.ajax({
        url: '/issuer/assertion',
        data: {
          url: url
        },
        success: function(obj) {
          // if the badge already exists in the database, skip this assertion
          if (obj.exists) {
            errors.push({
              url: url,
              reason: 'EXISTS'
            });
            processNext();
          }

          // make sure the recipient matches the current user.
          else if (!obj.owner) {
            errors.push({
              url: url,
              reason: 'INVALID'
            });
            processNext();
          }

          else {
            var templateArgs = {
              hostname: url,
              assertion: obj.badge
            };
            $("#badge-ask").empty()
              .append($("#badge-ask-template").render(templateArgs)).fadeIn();
            $("#badge-ask .accept").click(function() {
              var post = jQuery.ajax({
                type: 'POST',
                url: '/issuer/assertion',
                data: {
                  url: url
                },
                success: function(data, textStatus, jqXHR) {
                  if (jqXHR.status == 304) {
                    showError("#already-exists-template", templateArgs);
                    errors.push({
                      url: url,
                      reason: "EXISTS"
                    });
                  } else
                    successes.push(url);
                },
                error: function(req) {
                  showError("#accept-failure-template", templateArgs);
                  errors.push({
                    url: url,
                    // TODO: Is this really the best reason?
                    reason: "INVALID"
                  });
                }
              });
              var fade = jQuery.Deferred();
              $("#badge-ask").fadeOut(function() { fade.resolve(); });
              jQuery.when(fade, post).always(processNext);
            });
            $("#badge-ask .reject").click(function() {
              errors.push({
                url: url,
                reason: 'DENIED'
              });
              $("#badge-ask").fadeOut(processNext);
            });
          }
        },
        error: function() {
          errors.push({
            url: url,
            reason: 'INACCESSIBLE'
          });
          processNext();
        }
      });
    }
  };
  var processNext = window.Assertions.processNext;
  $(".navbar .closeFrame").click(function() {
    assertions.forEach(function(assertion) {
      errors.push({
        url: assertion,
        reason: 'DENIED'
      });
    });
    assertions = [];
    processNext();
    return false;
  });
}

function buildChannel() {
  if (window.parent === window)
    return null;
  
  var channel = Channel.build({
    window: window.parent,
    origin: "*",
    scope: "OpenBadges.issue"
  });

  channel.bind("issue", function(trans, s) {
    issue(s, function(errors, successes) {
      trans.complete([errors, successes]);
    });
    trans.delayReturn(true);
  });
  
  return channel;
}
