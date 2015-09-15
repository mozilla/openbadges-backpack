/**
 * A tiny library for load-loading social media share buttons.
 * If we don't do this, social media will track users even before
 * they click the like button and we don't like that kind of
 * monitoring behaviour.
 */
var SocialMedia = function() {};

(function() {
  var urlPlaceHolder = "__URL__PLACE__HOLDER__";

  SocialMedia.prototype = {

    facebook: {
      id: "facebook-jssdk",
      src: "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.4",
      html: "<div class='fb-share-button' data-href='"+urlPlaceHolder+"' data-layout='button_count'></div>"
    },

    google: {
      id: "google-plus",
      src: "//apis.google.com/js/plusone.js",
      html: "<div class='g-plusone' data-size='medium' data-annotation='none' data-href='"+urlPlaceHolder+"'></div>"
    },

    twitter: {
      id: "twitter-wjs",
      src: "//platform.twitter.com/widgets.js",
      html: "<a href='https://twitter.com/share' class='twitter-share-button' data-count='none' data-text='Check out my OpenBadges at ' data-via='OpenBadges' data-dnt='true'>Tweet</a>"
    },

    linkedin: {
      id: "linkedin",
      src: "//platform.linkedin.com/in.js",
      html: "<script type='IN/Share' data-url='"+urlPlaceHolder+"' data-counter='right'></script>"
    },

    /**
     * Hot-load a social medium's button by first
     * injecting the necessary HTML for the medium
     * to perform its own iframe replacements, and
     * then late-loading the script required for
     * the medium to load up its functionality.
     */
    hotLoad:  function(element, socialMedium, url) {
      var oldScript = document.getElementById(socialMedium.id);
      if (oldScript)
        oldScript.parentNode.removeChild(oldScript);
      var html = socialMedium.html.replace(urlPlaceHolder, url);
      $(element).html(html);

      if(socialMedium.src !== "") {
        (function(document, id, src) {
          var script = document.createElement("script");
          script.type = "text/javascript";
          script.id = id;
          script.src = src;
          document.head.appendChild(script);
        }(document, socialMedium.id, socialMedium.src));
      }
    }
  };
}());
