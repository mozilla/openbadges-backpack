module('Login');

var completed = 0;

function checkFinished() {
  if (completed === 6) {
    QUnit.done();
  }
}

asyncTest('Login fails w/ missing csrf', 1, function(){
  // ensure we're logged out to begin with
  $.get('/backpack/signout', function() {
    $.get('/backpack/login', function(res) {
      completed += 1;
      checkFinished();
      var $res = $(res);

      var data = {
        email: 'user@example.com',
        password: 'letmein'
      }

      $.ajax({
        type: "POST",
        url: '/backpack/login',
        success: function (response) {
            // don't expect to get here!
        },
        error: function (xhr, ajaxOptions, thrownError) {
          equal(true, xhr.status==403);
          start();
        }
      });
      
    });
  });
});

asyncTest('Login fails w/ wrong csrf', 1, function(){
  // ensure we're logged out to begin with
  $.get('/backpack/signout', function() {
    $.get('/backpack/login', function(res) {
      completed += 1;
      checkFinished();
      var $res = $(res);

      var data = {
        _csrf: 'WRONG_CSRF_TOKEN',
        email: 'user@example.com',
        password: 'letmein'
      }

      $.ajax({
        type: "POST",
        url: '/backpack/login',
        success: function (response) {
            // don't expect to get here!
        },
        error: function (xhr, ajaxOptions, thrownError) {
          equal(true, xhr.status==403);
          start();
        }
      });
      
    });
  });
});

asyncTest('Login fails w/ wrong user', 1, function(){
  // ensure we're logged out to begin with
  $.get('/backpack/signout', function() {
    $.get('/backpack/login', function(res) {
      completed += 1;
      checkFinished();
      var $res = $(res);

      var data = {
        _csrf: $res.find('input[name="_csrf"]').val(),
        email: 'wronguser@example.com',
        password: 'letmein'
      }

      $.post('/backpack/login', data, function(formRes) {
        var loggedIn = (formRes.indexOf('data-logged-in="true"') !== -1);
        equal(false, loggedIn);
        start();
      });
      
    });
  });
});

asyncTest('Login fails w/ wrong password', 1, function(){
  // ensure we're logged out to begin with
  $.get('/backpack/signout', function() {
    $.get('/backpack/login', function(res) {
      completed += 1;
      checkFinished();
      var $res = $(res);

      var data = {
        _csrf: $res.find('input[name="_csrf"]').val(),
        email: 'user@example.com',
        password: 'allyourbase'
      }

      $.post('/backpack/login', data, function(formRes) {
        var loggedIn = (formRes.indexOf('data-logged-in="true"') !== -1);
        equal(false, loggedIn);
        start();
      });
      
    });
  });
});

asyncTest('Login succeeds', 1, function(){
  // ensure we're logged out to begin with
  $.get('/backpack/signout', function() {
    $.get('/backpack/login', function(res) {
      completed += 1;
      checkFinished();
      var $res = $(res);

      var data = {
        _csrf: $res.find('input[name="_csrf"]').val(),
        email: 'user@example.com',
        password: 'letmein'
      }

      $.post('/backpack/login', data, function(formRes) {
        var loggedIn = (formRes.indexOf('data-logged-in="true"') !== -1);
        equal(true, loggedIn);
        start();
      });
      
    });
  });
});

asyncTest('Logout succeeds', 1, function(){
  // ensure we're logged out to begin with
  $.get('/backpack/signout', function(res) {
    var loggedIn = (res.indexOf('data-logged-in="true"') !== -1);
    equal(false, loggedIn);
    start();
  });
});
