(function($){
  var assertionField = $('#assertion');
  var resultSection = $('#result');
  var showBadge = function(badgeURL, assertion){
    var img = $('<img>').attr('src', badgeURL)
      , header1 = $('<h3>').html('I found this data')
      , header2 = $('<h3>').html('and put the assertion URL in this badge')
      , hint = $('<h4>').html('click image to download!').css({'color': '#ddd'})
      , link = $('<a>').attr('href', badgeURL).css({'float': 'left'})
      , badgeData = $('<pre>').html(Formatter(assertion).format())
    link.append(img);
    
    resultSection.removeClass('failure').addClass('success');
    resultSection.empty().append(header1, badgeData, header2, link, hint);
    resultSection.animate({opacity: 1.0});
  }
  var process_reason = function(reason) {
    var html = '';
    if (reason && typeof reason === "object") {
      html += '<ul>';
      for (field in reason) {
        html += '<li><strong>'+ field +'</strong>: '+ reason[field].type +'</li>';
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
    
    resultSection.removeClass('success').addClass('failure');
    resultSection.empty().append(header, description);
    
    if (data.debug) {
      resultSection.append($('<h3>').html("I found this data"));
      resultSection.append($('<pre>').html(Formatter(JSON.stringify(data.debug)).format()));
    }
    
    resultSection.animate({opacity: 1.0});
  }
  
  $('#submit').ajaxStart(function(){
    var self = $(this);
    self.fadeOut(200),
    self.queue(function(){
      self.removeClass('primary')
          .addClass('disabled')
          .attr('disabled', true)
          .val('Wait for it...')
          .fadeIn(200);
      self.dequeue();
    })
  });
  
  $('#submit').ajaxComplete(function(){
    var self = $(this);
    self.fadeOut(200)
    self.queue(function(){
      self.val('Build this badge')
          .attr('disabled', false)
          .addClass('primary')
          .removeClass('disabled')
          .fadeIn(200);
      self.dequeue();
    })
  });
  
  $('#bake-form').bind('submit', function(e){
    var assertionURL = assertionField.val()
      , badgeURL = '/baker?assertion='+encodeURIComponent(assertionURL)
      , self = $(this)
    e.preventDefault();
    if (!assertionURL || self.data('submitting')) return false;
    if (resultSection.css('opacity') !== 0) {
      resultSection.animate({opacity:0});
    }
    self.data('submitting', true);
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
            showBadge(badgeURL, data.assertion); next();
          });
        }
      }
    });
    return false;
  })
  $('#bake-form').ajaxComplete(function(){
    $(this).data('submitting', false);
  })
  resultSection.css({opacity:0})
  
})(jQuery);

