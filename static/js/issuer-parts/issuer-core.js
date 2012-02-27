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
      var div = $('<div></div>');
      div.css({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }).appendTo(document.body);
      var iframe = document.createElement("iframe");
      iframe.setAttribute("src", root + "issuer/frame");
      iframe.setAttribute("scrolling", "no");
      $(iframe).css({
        border: "none",
        position: "absolute",
        top: "20%",
        height: "60%",
        width: "80%",
        left: "10%",
        right: "10%"
      });
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
                div.remove();
                callback(v[0], v[1]);
              }
            });
          }
        });
      }).appendTo(div);
      hook("create", iframe);
    }
  };
  
  return OpenBadges;
})();
