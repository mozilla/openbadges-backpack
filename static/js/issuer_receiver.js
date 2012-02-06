WinChan.onOpen(function(origin, args, cb) {
  alert("yo!" + args);
  $("#test").text(JSON.stringify(args, null, "    "));
});
