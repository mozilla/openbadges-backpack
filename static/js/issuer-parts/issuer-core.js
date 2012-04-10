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
        left: "50%",
        height: "60%",
        top: "20%"
      });
      OpenBadges.resize(iframe);
      $(window).resize(function(){OpenBadges.resize(iframe);});
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
    },
    resize: function(el){
      // the basic issuer frame column is 300px wide with 20px padding
      var column = 300;
      var margin = 20;
      var twoCol = (column * 2) + (margin * 3);
      var winWidth = $(window).width();
      var elWidth = $(el).width();

      function asPx(n) {
        return n.toString() + 'px';
      }

      var newSize = {};
      if (winWidth >= twoCol && elWidth < twoCol){
        // two-column iframe
        newSize = {
          width: asPx(twoCol),
          "margin-left": asPx(-twoCol/2),
          height: "60%",
          top: "20%"
        };
      }
      else if (winWidth < twoCol && elWidth >= twoCol) {
        // one-column iframe
        newSize = {
          width: asPx(column + (2 * margin)),
          "margin-left": asPx(-(column + (2 * margin))/2),
          height: "90%",
          top: "5%"
        };
      }
      
      if (newSize) {
        $(el).animate(newSize);
      }
    }
  };
  
  return OpenBadges;
})();
