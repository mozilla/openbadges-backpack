// stubbyid.js v0.2
// A simple client-side "simulator" for the Persona login service.
// https://github.com/toolness/stubbyid

(function() {
  "use strict";

  var LOGIN_STATE_KEY = "STUBBYID_LOGIN_STATE";
  var widget = {
    el: document.createElement('div'),
    update: function() {
      var state = getLoginState();
      if (state) {
        widget.el.innerHTML = 'Persona simulator thinks you want to ' +
                              'be logged in as <strong>' + escapeHtml(state) +
                              '</strong>. <button>logout</button>';
      } else {
        widget.el.innerHTML = 'Persona simulator thinks you want to ' +
                              'be logged out. <button>login</button>';
      }
    },
    init: function() {
      widget.el.style.position = "fixed";
      widget.el.style.bottom = "0";
      widget.el.style.right = "0";
      widget.el.style.color = "white";
      widget.el.style.fontFamily = "Helvetica, Arial, sans-serif";
      widget.el.style.fontSize = "12px";
      widget.el.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
      widget.el.style.padding = "4px";
      widget.el.style.zIndex = "100000";
      attach(widget.el, "click", function(event) {
        if (target(event).nodeName == "BUTTON") {
          if (getLoginState())
            setLoginState(null, false);
          else
            setLoginState(window.prompt("Enter email address") || null,
                          false);
        }
      });
      document.body.appendChild(widget.el);
      widget.update();
    }
  };
  var escapeHtml = function(string) {
    var entityMap = {
       "&": "&amp;",
       "<": "&lt;",
       ">": "&gt;",
       '"': '&quot;',
       "'": '&#39;',
       "/": '&#x2F;'
     };

     return String(string).replace(/[&<>"'\/]/g, function (s) {
       return entityMap[s];
     });
  };
  var target = function(event) {
    return event.target || event.srcElement;
  };
  var attach = function(element, eventName, cb) {
    if (element.addEventListener)
      element.addEventListener(eventName, cb, false);
    else
      element.attachEvent('on' + eventName, cb);
  };
  var setLoginState = function(state, notifyWatcher) {
    if (typeof(notifyWatcher) == "undefined") notifyWatcher = true;
    state = state || null;
    if (getLoginState() === state)
      return;
    if (state) {
      window.localStorage.setItem(LOGIN_STATE_KEY, state);
      widget.update();
      if (notifyWatcher) watchOptions.onlogin(state);
    } else {
      window.localStorage.removeItem(LOGIN_STATE_KEY);
      widget.update();
      if (notifyWatcher) watchOptions.onlogout();
    }
  };
  var getLoginState = function() {
    return window.localStorage.getItem(LOGIN_STATE_KEY) || null;
  };
  var fail = function(msg) {
    log(msg);
    throw new Error(msg);
  };
  var log = function(msg) {
    if (window.console && window.console.log)
      window.console.log("STUBBYID: " + msg);
    if (navigator.id.stubby.onlog)
      navigator.id.stubby.onlog(msg);
  };
  var watchOptions = {
    _onlogin: null,
    _onlogout: null,
    onlogin: function(assertion) {
      if (watchOptions._onlogin) {
        log("Calling onlogin().");
        watchOptions._onlogin(assertion);
      }
    },
    onlogout: function() {
      if (watchOptions._onlogout) {
        log("Calling onlogout().");
        watchOptions._onlogout();
      }
    }
  };

  window.navigator.id = {
    stubby: {
      reset: function() {
        watchOptions._onlogin = null;
        watchOptions._onlogout = null;
        setLoginState(null);
      },
      onlog: null,
      setPersonaState: setLoginState,
      getPersonaState: getLoginState,
      widgetElement: widget.el
    },
    // https://developer.mozilla.org/en-US/docs/DOM/navigator.id.watch
    watch: function navigator_id_watch(options) {
      if (!(typeof(options.loggedInUser) == "undefined" ||
            typeof(options.loggedInUser) == "string" ||
            options.loggedInUser === null))
        fail("loggedInUser must be null, undefined, or string");
      if (typeof(options.onlogin) != "function")
        fail("onlogin must be a function");
      if (typeof(options.onlogout) != "function")
        fail("onlogout must be a function");

      var personaState = getLoginState();
      var loggedInUser = options.loggedInUser;
      var reasoning = "";

      watchOptions._onlogin = options.onlogin;
      watchOptions._onlogout = options.onlogout;

      if (typeof(loggedInUser) == "undefined") {
        reasoning = "Client doesn't know if user is logged in or not ";
        if (personaState) {
          log(reasoning + "and they want to be logged in as " +
              personaState + ".");
          watchOptions.onlogin(personaState);
        } else {
          log(reasoning + "and they want to be logged out. ");
          watchOptions.onlogout();
        }
      } else if (typeof(loggedInUser) == "string") {
        reasoning = "Client thinks the user is logged in as " +
                    loggedInUser + " ";

        if (personaState) {
          if (personaState == loggedInUser) {
            log(reasoning + "and they want to be, so doing nothing.");
          } else {
            log(reasoning + "but they want to be logged in as " +
                personaState + ".");
            watchOptions.onlogin(personaState);
          }
        } else {
          log(reasoning + "but they want to be logged out.");
          watchOptions.onlogout();
        }
      } else if (loggedInUser === null) {
        reasoning = "Client thinks the user is logged out ";
        if (personaState) {
          log(reasoning + "but they want to be logged in as " +
              personaState + ".");
          watchOptions.onlogin(personaState);
        } else {
          log(reasoning + "and they want to be, so doing nothing.");
        }
      }
    },
    request: function navigator_id_request(options) {
      options = options || {};
      var response = window.prompt("Enter email address");
      if (!response) {
        if (options.oncancel)
          options.oncancel();
        return;
      }
      setLoginState(response);
    },
    logout: function navigator_id_logout() {
      setLoginState(null);
    },
    get: function navigator_id_get(gotAssertion) {
      var email = window.prompt("Enter email address") || null;
      window.setTimeout(function() { gotAssertion(email); }, 1);
    }
  };

  window.navigator.id.getVerifiedEmail = window.navigator.id.get;

  if (document.readyState == "complete")
    widget.init();
  else
    attach(window, "load", widget.init);
})();
