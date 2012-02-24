var OpenBadges = (function() {
  function findRoot() {
    for (var i = 0; i < document.scripts.length; i++) {
      var script = document.scripts[i];
      var match = script.src.match(/(.*)\/issuer\.js$/);
      if (match)
        return match[1] + '/';
    }
    throw new Error("issuer script not found.");
  }
  
  var OpenBadges = {
    // The root URL of the Open Badges API, determined dynamically.
    ROOT: null,
    // This function is documented at:
    //   https://github.com/mozilla/openbadges/wiki/Issuer-API
    // The final (undocumented) argument is used for testing.
    issue: function OpenBadges_issue(assertions, callback, hook) {
      var root = this.ROOT = findRoot();
      var iframe = document.createElement("iframe");
      iframe.setAttribute("src", root + "issuer/frame");
      iframe.setAttribute("width", "640");
      iframe.setAttribute("height", "480");
      iframe.setAttribute("scrolling", "no");
      iframe.setAttribute("style", "border: none");
      if (!hook) hook = function() {};
      $(iframe).one("load", function() {
        hook("load", iframe);
        var channel = Channel.build({
          window: iframe.contentWindow,
          origin: root,
          scope: "OpenBadges.issue",
          onReady: function() {
            channel.call({
              method: "issue",
              params: assertions,
              success: function(v) {
                $(iframe).remove();
                callback(v[0], v[1]);
              }
            });
          }
        });
      }).appendTo(document.body);
      hook("create", iframe);
    }
  };
  
  return OpenBadges;
})();
