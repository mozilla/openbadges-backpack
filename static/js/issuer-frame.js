var CSRF = $("meta[http-equiv='X-CSRF-Token']").attr("content");
var currentUser = $("meta[http-equiv='X-Current-User']").attr("content");

function showLogin() {
  $(".logged-out, .logged-in").hide();
  if (!currentUser) {
    $(".logged-out").show();
  } else {
    $(".logged-in").show();
  }
}

showLogin();

$(".js-browserid-link").click(function() {
  navigator.id.getVerifiedEmail(function(assertion) {
    jQuery.ajax({
      url: '/backpack/authenticate',
      type: 'POST',
      dataType: 'json',
      data: {
        _csrf: CSRF,
        assertion: assertion
      },
      success: function(data) {
        currentUser = data.email;
        showLogin();
      },
      error: function() {
        console.log("uhoh");
      }
    });
    // TODO: Display a throbber or something.
  });
  return false;
});

var channel = Channel.build({
  window: window.parent,
  origin: "*",
  scope: "OpenBadges.issue"
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

channel.bind("issue", function(trans, s) {
  issue(s, function(errors, successes) {
    trans.complete([errors, successes]);
  });
  trans.delayReturn(true);
});
