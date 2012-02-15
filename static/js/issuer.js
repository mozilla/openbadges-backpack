var issuer = (function() {
  return {
    sendIt: function (badgeAssertion, apiHost) {
      // badgeAssertion can be a list of just assertion_urls, a single assertion, or a
      // [{'assertion_url':'http://whatever',
      //   'badge_url':'http://whatever/badge.png'}]

      if (! $.isArray(badgeAssertion)) {
        badgeAssertion = [badgeAssertion];
      }

      var iframe = document.createElement('iframe');
      $("body").append(iframe);
      //$(iframe).hide();
      iframe.src = apiHost + "/api/issuer";

      var sendMessage = function(badgeAssertion) {
        parentChannel.call({method:'loadAsserts',
                            params: badgeAssertion,
                            success: function(v) {
                              console.log("chris is cool");
                            }});
      };

      var parentChannel = Channel.build({window: iframe.contentWindow,
                                         origin: "*", 
                                         scope: "badgeScope",
                                         onReady: function() {sendMessage(badgeAssertion)}});

      console.log(badgeAssertion);

      return iframe;
    }};
})();
