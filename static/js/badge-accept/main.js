// TODO: Make sure we display the origin of the issuer (parent frame).

_.templateSettings = {
  escape : /\[\[(.+?)\]\]/g
};

jQuery.fn.extend({
  render: function(args) {
    var template = _.template(this.html());
    return $(template(args));
  }
});

var Session = Session();
var App;

function showBadges() {
  $("#welcome").fadeOut(App.start);
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
      Session.on("login-abort", function(){
        $(".logged-in .next").click(showBadges);
      });
      return false;
    });
  }

  Session.on("login-error", function() {
    showError("#login-error-template");
  });
  Session.on("login-complete", showBadges);
  $(".host").text(window.location.host);
});

function showError(template, data) {
  $(template).render(data).appendTo("#messages").hide().slideDown(function(){
    var msg = this;
    $('.close', msg).click(function(){
      $(msg).slideUp(function(){
	      $(this).remove();
      });
    });
  });
}

function issue(assertions, cb){

  if (assertions.length == 1) {
    $("#welcome .badge-count").text("1 badge");
  }
  else {
    $("#welcome .badge-count").text(assertions.length + " badges");
  }
  $("#welcome").fadeIn();

  App = App(assertions);
  var badgesProcessed;

  App.on('badges-ready', function(failures, badges){
    badgesProcessed = $.Deferred();

    var next = 0;
    function offerNext(){
      if (next >= badges.length) {
        $("#badge-ask").fadeOut(function(){
          badgesProcessed.resolve();
        });
	      return;
      }

      var badge = badges[next++];
      var templateArgs = {
        assertion: badge.data.badge,
        user: Session.currentUser,
        unhashedRecipient: badge.data.recipient
      };
      $("#badge-ask").fadeOut(function(){
        $(this).empty()
          .append($("#badge-ask-template")
          .render(templateArgs))
          .fadeIn();
        $("#badge-ask .accept").click(function(){
          badge.issue();
          offerNext();
        });
        $("#badge-ask .reject").click(function(){
          badge.reject('DENIED');
          offerNext();
        });
      });
    }
    offerNext();
  });

  function exit(failures, successes) {
    // We're on our way out. Disable all event handlers on the page,
    // so the user can't do anything.
    $("button, a").unbind();
    function results(badge) {
      return badge.result();
    }
    cb(_.map(failures, results), _.map(successes, results));
  }

  App.on('badges-complete', function(failures, successes, t){
    $.when(badgesProcessed).always(function(){
      if (successes.length < 2)
	      $("#farewell .badges-" + successes.length).show();
      else {
        $("#farewell .badges-many").show();
        $("#farewell .badges-added").text(successes.length);
      }

      // bind/rebind all the ways to exit
      $("#farewell .next").click(function(){ exit(failures, successes); });
      $(".navbar .closeFrame").unbind().click(function(){ exit(failures, successes); });
      $('body').unbind('keydown').keydown(function (event) {
        if (event.keyCode === 27) exit(failures, successes);
      });

      $("#farewell").fadeIn();
      return;
    });
  });

  App.on('badges-aborted', function(failures, successes, t){
    exit(failures, successes);
  });

  App.on('badge-failed', function(badge){
    var error = badge.error || { reason: 'UNKNOWN' }; // TODO: handle this better
    if (error.reason === 'INACCESSIBLE') {
      showError('#inaccessible-template', { error: error });
    }
    else if (error.reason !== 'DENIED') {
      var templateData = {
        error: error,
        assertion: badge.data.badge, // data.badge is really the assertion
        user: Session.currentUser
      };
      if (error.reason === 'INVALID') {
        if (badge.data.owner) {
          showError('#accept-failure-template', templateData);
        }
        else {
          showError('#owner-mismatch-template', templateData);
        }
      }
      else if (error.reason === 'EXISTS') {
	      showError('#already-exists-template', templateData);
      }
    }
  });

  // set up all the ways to bail out
  $(".navbar .closeFrame").click(function() {
    App.abort();
    return false;
  });
  $('body').keydown(function (event) {
    if (event.keyCode === 27) App.abort();
  });
}
