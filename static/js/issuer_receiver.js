var issuer_reciever = (function(){
  console.log("the receiver is starting");
  var l = $("#added_badges");
  var csrf = $("#csrf").attr("value");

  function postSuccessful(response) {
    l.append("<li>"+response+"</li>");
  }

  function postFail(e) {
    // hmmm
    l.append("<li>some error happened</li>");  
  }

  var childChannel = Channel.build({window: window.parent,
                                    origin: "*",
                                    scope: "badgeScope",
                                    debugOutput: true,
                                    onReady: function() { console.log("channel ahoy!"); }
                                   });

  function postBadges(badges) {
    console.log("badges on the receiver " + badges);
    _.each(badges, 
           function(assertion) {
             if (typeof(assertion_) == object) {
               assertion = assertion.assertion;
             }
             $.post('/api/issuer', 
                    { assertion:assertion, _csrf:csrf }, 
                    postSuccessful, 
                    postFail);
           });
    return "success?";
  }


  childChannel.bind("loadAsserts", function(trans, badges) { 
    console.log("channel called " + badges);
    return postBadges(badges);
  });
})();
