(function () {
  var emailre = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

  var $email = $('.email');
  var $submitter = $('.submit input')
  var $userid = $('.userid')
  var $error = $('#converter .alert-error')
  var $success = $('#converter .alert-success')

  function changed ($el) { return $el.data('initial') !== $el.val() }
  
  function storeState (event) {
    var $this = $(this)
    $this.data('initial', $this.val())
  }
  
  function keymon (event) {
    var $this = $(this)
    if (event.keyCode === 13) {
      query(event)
    }
    if (event.keyCode === 27) {
      var restore = $this.data('initial')||''
      $this.val(restore).blur()
    }
  }

  function showError (msg) {
    $userid.val(':(')
    clearTimeout($error.data('timer'))
    $error.data('timer', setTimeout(function () { $error.slideUp() }, 3000))
    $error.stop().html(msg).slideDown()
  }
  
  function showSuccess (msg) {
    clearTimeout($success.data('timer'))
    $success.data('timer', setTimeout(function () { $success.slideUp() }, 5000))
    $success.stop().html(msg).slideDown()
  }

  function successHandler (data, status) {
    $userid.val(data.userId)
    showSuccess('<strong>Success!</strong> The email address <em>' + data.email + '</em> maps to user id <strong>'+ data.userId + '</strong>');
  }
  
  function missingHandler (email) {
    var msg = '<strong>Bummer,</strong> we could not find a user by the email <em>' + email + '</em>'    
    return function () { showError(msg) }
  }
  
  function query () {
    var email = $email.val()
    if (!email.match(emailre)) {
      showError('<strong>Hey,</strong> that does not look like a real email address to me.');
      return;
    }
    
    if (!changed($email)) return;
    $.ajax({
      type: 'post',
      url: window.location,
      data: { email: email },
      success: successHandler,
      statusCode: { 404: missingHandler(email) }
    })
  }

  $email.on('focus', storeState)
  $email.on('keyup', keymon)
  $submitter.on('click', query)
})()