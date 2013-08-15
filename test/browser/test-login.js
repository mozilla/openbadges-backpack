(function() {
  module("login");

  var script = $.get("/js/login.js", "", "text");

  function loginTest(name, options, cb) {
    if (!cb) {
      cb = options;
      options = {};
    }

    asyncTest(name, function() {
      script.always(function() {
        var watch = sinon.spy();
        var server = sinon.fakeServer.create();
        var csrfMeta = $('<meta name="csrf">')
          .attr('content', options.csrf || 'csrf!').appendTo("body");
        var emailMeta = $('<meta name="email">')
          .attr('content', options.email || '').appendTo("body");

        navigator.id = {
          watch: watch,
          request: sinon.spy(),
          logout: sinon.spy()
        };

        eval(script.responseText);

        var reloadPageStub = sinon.stub(window, "reloadPage");

        ok(watch.calledOnce, "navigator.id.watch() called on page load");

        cb({
          watchArgs: watch.args[0][0],
          server: server
        });

        $("body").unbind("click");
        csrfMeta.remove();
        emailMeta.remove();
        reloadPageStub.restore();
        delete navigator.id;
        server.restore();    
        start();
      });
    });
  }

  loginTest("click .js-login triggers navigator.id.request", function(t) {
    var btn = $('<a href="#" class="js-login">login</a>').appendTo("body");
    btn.click();
    ok(navigator.id.request.calledOnce);
    btn.remove();
  });

  loginTest("click .js-logout triggers navigator.id.logout", function(t) {
    var btn = $('<a href="#" class="js-logout">logout</a>').appendTo("body");
    btn.click();
    ok(navigator.id.logout.calledOnce);
    btn.remove();
  });

  loginTest("onlogin() reloads page on success", function(t) {
    equal(t.watchArgs.loggedInUser, null);
    t.server.respondWith("POST", "/persona/verify", function(req) {
      equal(req.requestBody, "assertion=assrt&_csrf=csrf!");
      req.respond(200, {"Content-Type": "text/plain"}, "foo@bar.org");
    });
    t.watchArgs.onlogin("assrt");
    ok(window.reloadPage.notCalled, "reloadPage() not called");    
    t.server.respond();
    ok(window.reloadPage.calledOnce, "reloadPage() called");
  });

  loginTest("onlogin() displays alert on verify failure", function(t) {
    sinon.stub(window, 'alert');
    t.server.respondWith("POST", "/persona/verify", function(req) {
      req.respond(200, {"Content-Type": "application/json"},
                  JSON.stringify({status: 'failure', reason: 'blah'}));
    });
    t.watchArgs.onlogin("assrt");
    t.server.respond();
    ok(window.reloadPage.notCalled, "reloadPage() not called");
    ok(window.alert.calledOnce, "alert() called once");
    deepEqual(window.alert.firstCall.args, ["LOGIN FAILURE: blah"]);
    window.alert.restore();
  });

  loginTest("onlogout() reloads page on success", {
    email: "bleh@bleh.com"
  }, function(t) {
    equal(t.watchArgs.loggedInUser, "bleh@bleh.com");
    t.server.respondWith("POST", "/persona/logout", function(req) {
      equal(req.requestBody, "_csrf=csrf!");
      req.respond(200, {"Content-Type": "text/plain"}, "logged out");
    });
    t.watchArgs.onlogout();
    ok(window.reloadPage.notCalled, "reloadPage() not called");
    t.server.respond();
    ok(window.reloadPage.calledOnce, "reloadPage() called");
  });
})();
