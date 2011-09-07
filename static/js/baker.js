(function($){
  var assertionField = $('#assertion');
  var resultSection = $('#result');
  var showBadge = function(badgeURL){
    var badge = $('img');
    resultSection.html('<img src=ballsack>');
    console.log('should have been built');
  }
  var showErrors = function(data) {
  }
  
  $('#bake-form').bind('submit', function(e){
    var assertionURL = assertionField.val()
      , badgeURL = '/baker?assertion='+assertionURL
    e.preventDefault();
    if (!assertionURL) return false;
    jQuery.get(badgeURL, function(data){
      if (data.status === 'success') {
        showBadge(badgeURL);
      }
      else {
        showErrors(data);
      }
    }, 'json')
    return false;
  })
})(jQuery);