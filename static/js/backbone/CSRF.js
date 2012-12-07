(function(){
  // global var
  var CSRF = $("input[name='_csrf']").val();

  $.ajaxSetup({
    beforeSend: function (xhr, settings) {
      if (settings.crossDomain)
        return;
      if (settings.type == "GET")
        return;
      xhr.setRequestHeader('X-CSRF-Token', CSRF)
    }
  });

}());