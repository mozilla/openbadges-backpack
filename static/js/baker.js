(function($){
  var assertionField = $('#assertion');
  var resultSection = $('#result');
  var showBadge = function(badgeURL){
    var img = $('<img>').attr('src', badgeURL)
      , header = $('<h3>').html('Vóila! Your badge, with assertion embedded.')
      , link = $('<a>').attr('href', badgeURL)
    link.append(img);
    
    resultSection.removeClass('failure').addClass('success');
    resultSection.empty().append(header, link);
    resultSection.animate({opacity: 1.0});
  }
  var showErrors = function(data) {
    var header = $('<h3>').html('Oh no! There was a problem')
      , description = $('<dl>')
      , error = $('<dt>Error</dt><dd><code>' + data.error + '</code></dd>')
      , reason = $('<dt>Reason</dt><dd>' + data.reason + '</dd>')
    description.append(error, reason)
    
    resultSection.removeClass('success').addClass('failure');
    resultSection.empty().append(header, description);
    resultSection.animate({opacity: 1.0});
  }
  
  $('#bake-form').bind('submit', function(e){
    var assertionURL = assertionField.val()
      , badgeURL = '/baker?assertion='+assertionURL
    e.preventDefault();
    if (!assertionURL) return false;
    
    if (resultSection.css('opacity') !== 0) {
      resultSection.animate({opacity:0});
    }
    
    jQuery.get(badgeURL, function(data){
      if (data.status === 'success') {
        resultSection.queue('fx', function(next){
          showBadge(badgeURL); next();
        });
      }
      else {
        resultSection.queue('fx', function(next){
          showErrors(data); next();
        });
      }
    }, 'json')
    return false;
  })
  resultSection.css({opacity:0})
})(jQuery);