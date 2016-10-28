const request = require('request');
const _ = require('underscore');
const qs = require('querystring');
const fs = require('fs');
const async = require('async');
const url = require('url');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require("nodemailer-smtp-transport");
const User = require('../models/user');
const flash = require('connect-flash');
const owasp = require('owasp-password-strength-test');

var configuration = require('../lib/configuration'),
  mailerConfig = configuration.get('mailer');

const smtpTrans = nodemailer.createTransport(smtpTransport({
  service: mailerConfig.service,
  auth: {
    user: mailerConfig.user,
    pass: mailerConfig.pass
  }
}));


/**
 * Render the user profile page.
 */

exports.profile = function profileUpdate(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }
  // request.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  response.render('user-profile.html', {
    error: request.flash('error'),
    csrfToken: request.csrfToken()
  });
};


/**
 * Update the user profile.
 */

exports.profilePost = function profileUpdatePost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  if (request.body.password !== request.body.confirm) {
    request.flash('error', 'Password field and confirm password field do not match');
    return response.redirect('back');
  }

  var result = owasp.test(request.body.password);

  if (result.errors.length > 0) {
    request.flash('error', result.errors);
    return response.redirect('back');
  }

  var user = request.user;

  user.attributes.password = user.generateHash(request.body.password);
  user.attributes.reset_password_token = null;
  user.attributes.reset_password_expires = null;
  user.attributes.updated_at = new Date().getTime();

  user.save(function(err) {
    request.flash('success', 'User profile has been updated successfully');
    return response.redirect('/');
  });
};


/**
 * Render password reset page
 */
exports.requestReset = function reset(request, response) {
  if (request.user) {
    return response.redirect(303, '/');
  }
  // request.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  response.render('request-reset-password.html', {
    error: request.flash('error'),
    csrfToken: request.csrfToken()
  });
};


/**
 * Handle form submission for password reset page
 */
exports.requestResetPost = function resetPost(request, response, next) {
  if (request.user) {
    return response.redirect(303, '/');
  }
  // request.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  async.waterfall([
    // generate token
    function(done) {
      crypto.randomBytes(32, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    // check if we have a valid user with submitted email, if so then
    // apply the token to them and give it an expiry time of 1 hour
    function(token, done) {
      User.findOne({ email: request.body.email }, function(err, user) {
        if (!user) {
          request.flash('error', 'No account with that email address exists.');
          return response.redirect('/password/reset');
        }

        user.attributes.reset_password_token = token;
        user.attributes.reset_password_expires = Date.now() + 3600000; // 1 hour
        user.attributes.updated_at = new Date().getTime();

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    // send password reset email to that user, with tokenised reset link
    function(token, user, done) {
      var mailOptions = {
        to: user.attributes.email,
        from: 'no-reply@backpack.openbadges.org',
        subject: 'Mozilla Openbadges Backpack Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + request.headers.host + '/password/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTrans.sendMail(mailOptions, function(err) {
        request.flash('info', 'An e-mail has been sent to ' + user.attributes.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    response.redirect('/backpack/login');
  });
};


/**
 * Render change password form page
 */
exports.reset = function change(request, response) {
  User.findOne({ reset_password_token: request.params.token, reset_password_expires: Date.now() }, function(err, user) {
    if (!user) {
      request.flash('error', 'Password reset token is invalid or has expired.');
      return response.redirect('/password/reset');
    }
    response.render('reset-password.html', {
      user: request.user,
      error: request.flash('error'),
      csrfToken: request.csrfToken(),
      token: request.params.token
    });
  });
}


/**
 * Handle form submission for password change page
 */
exports.resetPost = function changePost(request, response) {
  async.waterfall([
    function(done) {
      User.findOne({ reset_password_token: request.body.token, reset_password_expires: Date.now() }, function(err, user) {
        if (!user) {
          request.flash('error', 'Password reset token is invalid or has expired.');
          return response.redirect('back');
        }

        if (request.body.password !== request.body.confirm) {
          request.flash('error', 'Password field and confirm password field do not match');
          return response.redirect('back');
        }

        var result = owasp.test(request.body.password);

        if (result.errors.length > 0) {
          request.flash('error', result.errors);
          return response.redirect('back');
        }

        user.attributes.password = user.generateHash(request.body.password);
        user.attributes.reset_password_token = null;
        user.attributes.reset_password_expires = null;
        user.attributes.updated_at = new Date().getTime();

        user.save(function(err) {
          done(err, user);
        });
      });
    },
    function(user, done) {
      var mailOptions = {
        to: user.attributes.email,
        from: 'no-reply@backpack.openbadges.org',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.attributes.email + ' has just been changed.\n'
      };
      smtpTrans.sendMail(mailOptions, function(err) {
        request.flash('success', 'Success! Your password has been changed.');
        done(err, 'done');
      });
    }
  ], function(err) {
    response.redirect('/backpack/login');
  });
};
