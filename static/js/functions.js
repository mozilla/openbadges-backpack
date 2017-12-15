(function($) {
    "use strict"; // Start of use strict

    // jQuery for page scrolling feature - requires jQuery Easing plugin
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 100
    });

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function() {
        $('.navbar-toggle:visible').click();
    });

    // Offset for Main Navigation
    $('#mainNav').affix({
        offset: {
            top: 50
        }
    });

    $('.send-email-address-verification-email').click(function(e) {
        e.preventDefault();
        var $form = $('#send-email-address-verification-email-form');
        $form.find('input[name="email_column"]').val($(this).data('email-col'));
        $.post($form.attr('action'), $form.serialize(), function(response) {
            if (response.status = 'ok') {
                $.bootstrapGrowl("Email sent successfully, check your inbox!", {
                    type: 'success',
                    delay: 2000
                });
            }
        });
    });

    if (window.location.hash == '#solongandthanksforallthefish') {
        $.bootstrapGrowl("Your account has been successfully deleted.", {
          type: 'success',
          delay: 6000
        });
    }

})(jQuery); // End of use strict
