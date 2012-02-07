WinChan.onOpen(function(origin, args, cb) {
  $("#test").text(args['badges'][0]);
  _.each(args['badges'], 
         function(assertion) {
           // post the assertion...one at a time?
         });
});
