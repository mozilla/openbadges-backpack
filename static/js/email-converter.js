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

  function showMessage (msg, type) {
    $.bootstrapGrowl(msg, {
      type: (type == 'success' ? 'success' : 'danger'),
      delay: 99999999
    });
  }

  function successHandler (data, status) {
    $userid.val(data.userId)
    showMessage('<strong>Success!</strong> The email address <em>' + data.email + '</em> maps to user id <strong>'+ data.userId + '</strong>', 'success');
  }
  
  function missingHandler (email) {
    $userid.val(':(');
    var msg = '<strong>Bummer,</strong> we could not find a user by the email <em>' + email + '</em>'    
    return function () { showMessage(msg, 'error') }
  }
  
  function query () {
    var email = $email.val()
    if (!email.match(emailre)) {
      showMessage('<strong>Hey,</strong> that does not look like a real email address to me.', 'error');
      return;
    }
    
    if (!changed($email)) return;
    $.ajax({
      type: 'post',
      url: window.location,
      data: { email: email },
      success: successHandler,
      error: missingHandler
    })
  }

  $email.on('focus', storeState)
  $email.on('keyup', keymon)
  $submitter.on('click', query)
})()
