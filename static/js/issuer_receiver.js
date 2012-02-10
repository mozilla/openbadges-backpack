var l = $("#added_badges");
var csrf = $("#csrf").attr("value");

function postSuccessful(response) {
  l.append("<li>"+response+"</li>");
}

function postFail(e) {
  // hmmm
  l.append("<li>some error happened</li>");  
}

WinChan.onOpen(function(origin, args, cb) {
  $("#closer").on('click', function() { 
    cb({thanks:'you are cool'});
    window.close();
  })
  $("#test").text(args['badges'][0]);
  _.each(args['badges'], 
         function(assertion) {
           // reverse issuer.issuerBadgeAddFromAssertion
           $.post('/api/issuer', { assertion:assertion, _csrf:csrf }, postSuccessful, postFail);
         });
});
