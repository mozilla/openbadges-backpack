$(function() {
  var requirements = [
    {
      'selector': 'req-1',
      'rule': 'The password must be at least 10 characters long.'
    },
    {
      'selector': 'req-2',
      'rule': 'The password must contain at least one lowercase letter.'
    },
    {
      'selector': 'req-3',
      'rule': 'The password must contain at least one uppercase letter.'
    },
    {
      'selector': 'req-4',
      'rule': 'The password must contain at least one number.'
    },
    {
      'selector': 'req-5',
      'rule': 'The password must contain at least one special character.'
    },
    {
      'selector': 'req-6',
      'rule': 'The password may not contain sequences of three or more repeated characters.'
    },
  ];

  $('input[type="password"]').keyup(function() {
    var results = owaspPasswordStrengthTest.test($(this).val());
    for (var i = requirements.length - 1; i >= 0; i--) {
      if (results.errors.indexOf(requirements[i].rule) === -1) {
        $('.' + requirements[i].selector).addClass('met');
      } else {
        $('.' + requirements[i].selector).removeClass('met');
      }
      if (i == (requirements.length - 1)) {
        if (results.errors.length == 0) {
          $('input[type="submit"].password-check').prop('disabled', false);
        } else {
          $('input[type="submit"].password-check').prop('disabled', true);
        }
      }
    }
  });
});
