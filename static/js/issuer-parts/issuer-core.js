var OpenBadges = (function() {
  var layout = (function(){
    var column = 300;
    var margin = 20;
    var twoCol = (column * 2) + (margin * 3);
    var oneCol = column + (margin * 2);

    function asPx(n) {
      return n.toString() + 'px';
    }

    function bestSize() {
      // the basic issuer frame column is 300px wide with 20px padding
      var winWidth = $(window).width();

      var size;
      if( winWidth >= twoCol ){
        // two-column iframe
        size = {
          width: asPx(twoCol),
          "margin-left": asPx(-twoCol/2),
          height: "60%",
          top: "20%"
        };
      }
      else {
        // one-column iframe
        size = {
          width: asPx(oneCol),
          "margin-left": asPx(-oneCol/2),
          height: "90%",
          top: "5%"
        };
      }

      return size;
    }

    var targetWidth;

    function resize(el){
      var winWidth = $(window).width();
      if(!targetWidth){
        targetWidth = $(el).width();
      }

      if ((winWidth >= layout.breakpoint && targetWidth < layout.breakpoint)
          || (winWidth < layout.breakpoint && targetWidth >= layout.breakpoint)){
        var size = bestSize();
        targetWidth = size.width.substring(0, size.width.length-2);
        $(el).animate(size, { queue: false });
      }
    }

    return {
      bestSize: bestSize,
      resize: resize,
      breakpoint: twoCol
    };

  })();

  var OpenBadges = {
    // Returns the root URL of the Open Badges API, determined dynamically.
    getRoot: function getRoot() {
      for (var i = 0; i < document.scripts.length; i++) {
        var script = document.scripts[i];
        var match = script.src.match(/(.*)\/issuer\.js$/);
        if (match)
          return match[1] + '/';
      }
      throw new Error("issuer script not found.");
    },
    // This function is documented at:
    //   https://github.com/mozilla/openbadges/wiki/Issuer-API
    // The final (undocumented) argument is used for testing.
    issue: function OpenBadges_issue(assertions, callback, hook) {
      // Setup defaults for arguments. I long for the day when javascript
      // supports defining these in the signature.
      assertions = typeof assertions === 'string' ? [assertions] : assertions;
      hook = hook || function () {};
      callback = callback || function () {};

      var root = this.getRoot();
      var div = $('<div></div>');
      div.css({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }).appendTo(document.body);
      var iframe = document.createElement("iframe");
      // add timestamp to aggressively cache-bust.
      var url = root + "issuer/frame?" + (new Date().getTime());
      iframe.setAttribute("src", url);
      iframe.setAttribute("scrolling", "no");
      var baseStyles = {
        border: "none",
        position: "absolute",
        left: "50%",
        'border-radius': '10px'
      };
      $(iframe).css($.extend(baseStyles, layout.bestSize()));
      $(window).resize(function(){layout.resize(iframe);});
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
        // set focus to the new iframe so key event handlers work
        // without the user having to click into it.
        $(iframe).focus();
      }).appendTo(div);
      hook("create", iframe);
    },
    // This function is not yet documented publicly.
    // It provides a modaless alternative to the classic issuer frame at the cost of the callback.
    issue_no_modal: function OpenBadges_issue_no_modal(assertions) {
      assertions = typeof assertions === 'string' ? [assertions] : assertions;
      var root = this.getRoot();
      var url = root + "issuer/frameless?" + (new Date().getTime());
      var form = $('<form method="POST"></form>').attr('action', url).appendTo($('body')).hide();
      for (var i = 0; i < assertions.length; i++) {
        var val = assertions[i];
        $('<input type="text" name="assertions">').val(val).appendTo(form);
      }
      form.submit();
    }
  };

  return OpenBadges;
})();
