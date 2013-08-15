window.reloadPage = function() {
  // We bind this to a global so we can stub it out in test suites, as
  // location.reload can't be stubbed.
  location.reload();
};

(function() {
  var csrfToken = $('meta[name="csrf"]').attr('content');
  var email = $('meta[name="email"]').attr('content') || null;

  navigator.id.watch({
    loggedInUser: email,
    onlogin: function(assertion) {
      $.post("/persona/verify", {
        assertion: assertion,
        _csrf: csrfToken
      }, function(response) {
        if (response && typeof(response) == "object" &&
            response.status == "failure") {
          alert("LOGIN FAILURE: " + response.reason);
        } else
          reloadPage();
      });
    },
    onlogout: function() {
      $.post("/persona/logout", {
        _csrf: csrfToken
      }, reloadPage);      
    }
  });

  $("body").on("click", ".js-login", function() {
    navigator.id.request();
    return false;
  });
  $("body").on("click", ".js-logout", function() {
    navigator.id.logout();
    return false;
  });
})();
