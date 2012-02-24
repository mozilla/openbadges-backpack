var Session = (function() {
  var loginStarted = false;
  var Session = {
    CSRF: $("meta[http-equiv='X-CSRF-Token']").attr("content"),
    currentUser: $("meta[http-equiv='X-Current-User']").attr("content"),
    login: function() {
      if (!Session.currentUser && !loginStarted) {
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
  $("#welcome").fadeOut(function() {
    
  });
}

$(window).ready(function() {
  if (!Session.currentUser) {
    $(".logged-out").show();
    Session.on("login-complete", showBadges);
    $(".logged-out .js-browserid-link").click(function() {
      Session.login();
      return false;
    });
  } else {
    $(".logged-in").show();
    $(".logged-in .next").click(showBadges);
    $(".logged-in .email").text(Session.currentUser);
    $(".logged-in .logout").click(function() {
      alert("TODO: Log out the user.");
      return false;
    });
  }

  $(".host").text(window.location.host);
  $(".topbar .close").click(function() {
    alert("TODO: Close window and send response to parent.");
    return false;
  });
});

// This is the core issuing implementation; the response is proxied
// back to the parent window. The function is global so it can be
// overridden from testing suites.
function issue(assertions, cb) {
  console.error("issue() is not yet implemented. returning DENIED for " +
                "everything right now.");
  var errors = assertions.map(function(url) {
    return {url: url, reason: "DENIED"};
  });
  setTimeout(function() { cb(errors, []); }, 10);
}

var channel = (function() {
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
})();
