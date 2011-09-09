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
  var process_reason = function(reason) {
    var html = '';
    if (reason && typeof reason === "object") {
      html += '<ul>';
      for (field in reason) {
        html += '<li><strong>'+ field +'</strong>: '+ reason[field] +'</li>';
      }
      html += '</ul>';
    }
    else { html = reason; }
    return html;
  }
  
  var showErrors = function(data) {
    var header = $('<h3>').html('Oh no! There was a problem')
      , description = $('<dl>')
      , error = $('<dt>Error</dt><dd><code>' + data.error + '</code></dd>')
      , reason = $('<dt>Reason</dt><dd>' + process_reason(data.reason) + '</dd>')
    description.append(error, reason)
    
    console.dir(data.reason);
    
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
    
    jQuery.ajax({
      url: badgeURL,
      dataType: 'json',
      error: function(jqXHR, status, error){
        var data = jQuery.parseJSON(jqXHR.responseText);
        resultSection.queue('fx', function(next){
          showErrors(data); next();
        });
      },
      success: function(data, status) {
        if (data.status === 'success') {
          resultSection.queue('fx', function(next){
            showBadge(badgeURL); next();
          });
        }
      }
    });
    return false;
  })
  resultSection.css({opacity:0})
})(jQuery);