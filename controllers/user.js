const request = require('request');
const _ = require('underscore');
const qs = require('querystring');
const fs = require('fs');
const async = require('async');
const url = require('url');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require("nodemailer-smtp-transport");
const flash = require('connect-flash');
const owasp = require('owasp-password-strength-test');
const shortid = require('shortid');

const User = require('../models/user');
const BadgeImage = require('../models/badge-image');
const Badge = require('../models/badge');
const Session = require('../models/backpack-connect').Session;
const Group = require('../models/group');
const Portfolio = require('../models/portfolio');

var configuration = require('../lib/configuration'),
    mailerConfig = configuration.get('mailer'),
    siteUrl = configuration.get('protocol') + '://' + configuration.get('hostname'),
    port = configuration.get('port');

if ((process.env.NODE_ENV !== 'heroku') && (port !== 80) && (port !== 443)) {
  siteUrl = siteUrl + ':' + port;
}

// prepare mailer
const smtpTrans = nodemailer.createTransport(smtpTransport({
  service: mailerConfig.service,
  auth: {
    user: mailerConfig.user,
    pass: mailerConfig.pass
  }
}));


/**
 * Render the migration email verification page, post-Persona login.
 */

exports.migrate = function migrate(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }
  return response.render('migration-step-1.html', {
    error: request.flash('error'),
    success: request.flash('success'),
    info: request.flash('info'),
    hideNav: true,
    csrfToken: request.csrfToken()
  });
}

exports.migratePost = function migratePost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  if (request.body.email !== request.body.confirm) {
    request.flash('error', 'Email field and confirm email field do not match');
    return response.redirect('back');
  }

  var user = request.user;

  // wipe the session now that we've confirmed we have an authenticated
  // user, to force them to verify migration email address
  request.session = null;

  // generate token
  crypto.randomBytes(32, function(err, buf) {

      var token = buf.toString('hex');

      // set user migration email
      user.attributes.migration_email = request.body.email;

      // update user with token
      user.attributes.reset_password_token = token;
      user.attributes.reset_password_expires = Date.now() + (3600000 * 24 * 30 * 6); // 180 day migration window
      user.attributes.updated_at = new Date().getTime();

      user.save(function(err) {
          // send email
          var mailOptions = {
              to: request.body.email,
              from: 'no-reply@backpack.openbadges.org',
              subject: 'Mozilla Openbadges Backpack Migration Instructions',
              text: 'You are receiving this because you (or someone else) have requested to migrate to the new Backpack account, from Persona (which is to be discontinued December 15th 2016).\n\n' +
                'Please click on the following link, or paste this into your browser to complete the migration and set your new backpack account password:\n\n' +
                siteUrl + '/migration/verify/' + token + '\n\n'
          };
          smtpTrans.sendMail(mailOptions, function(err) {
              response.redirect('/migration-step-2');
          });
      });
  });
}

/**
 * Render migration email verification form page (slightly altered password reset page)
 */
exports.migrateVerify = function migrateVerify(request, response) {
  User.findOne({ reset_password_token: request.params.token, reset_password_expires: Date.now() }, function(err, user) {
    if (!user) {
      request.flash('error', 'Migration token is invalid or has expired.');
      return response.redirect('/');
    }
    // by rendering this page, we can verify the email address, as it is ^extremely^ unlikely that someone guessed/brute-forced the tokenised link
    // it probably best to update the old email column now, in case the user doesn't complete the migration process and gets locked out due to an
    // expired migration token
    user.attributes.email = user.attributes.migration_email;
    user.attributes.migration_email = null;

    user.save(function(err) {
      response.render('migration-step-3.html', {
        user: request.user,
        error: request.flash('error'),
        success: request.flash('success'),
        info: request.flash('info'),
        csrfToken: request.csrfToken(),
        token: request.params.token
      });
    });

  });
}

/**
 * Handle form submission for migration email verification page
 */
exports.migrateVerifyPost = function migrateVerifyPost(request, response) {
  async.waterfall([
    function(done) {
      User.findOne({ reset_password_token: request.body.token, reset_password_expires: Date.now() }, function(err, user) {
        if (!user) {
          request.flash('error', 'Migration token is invalid or has expired.');
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
        subject: 'Your password has been set',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.attributes.email + ' has been set.  You can now login to your backpack.\n'
      };
      smtpTrans.sendMail(mailOptions, function(err) {
        request.flash('success', 'Success! Your password has been set.');
        done(err, 'done');
      });
    }
  ], function(err) {
    response.redirect('/backpack/login');
  });
};


/**
 * Render the user profile page.
 */

exports.profile = function profile(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  // request.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  response.render('user-profile.html', {
    error: request.flash('error'),
    success: request.flash('success'),
    info: request.flash('info'),
    csrfToken: request.csrfToken(),
    user: request.user,
  });
};


/**
 * Change user's name from the the user profile page.
 */

exports.profileUpdateNamePost = function profileUpdateNamePost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  var user = request.user;

  user.attributes.first_name = request.body.first_name;
  user.attributes.last_name = request.body.last_name;
  user.attributes.updated_at = new Date().getTime();

  user.save(function(err) {
    request.flash('success', 'User name has been updated successfully');
    return response.redirect('/user/profile');
  });
};


/**
 * Change password from the the user profile page.
 */

exports.profileChangePasswordPost = function profileChangePasswordPost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  if (request.body.password !== request.body.confirm) {
    request.flash('error', 'Password field and confirm password field do not match');
    return response.redirect('/user/profile');
  }

  var result = owasp.test(request.body.password);

  if (result.errors.length > 0) {
    request.flash('error', result.errors);
    return response.redirect('/user/profile');
  }

  var user = request.user;

  user.attributes.password = user.generateHash(request.body.password);
  user.attributes.reset_password_token = null;
  user.attributes.reset_password_expires = null;
  user.attributes.updated_at = new Date().getTime();

  user.save(function(err) {
    response.render('user-profile.html', {
      success: ['Password has been updated successfully'],
      csrfToken: request.csrfToken(),
      user: request.user,
    });
  });
};


/**
 * Add additional email from the the user profile page.
 */

exports.profileAddAdditionalEmailPost = function profileAddAdditionalEmailPost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  if (request.body.additional_email_1) {
    var additionalEmailAddress = request.body.additional_email_1;
  } else if (request.body.additional_email_2) {
    var additionalEmailAddress = request.body.additional_email_2;
  }

  // check to see that we don't already have this email in the system
  User.findOne({ email : additionalEmailAddress }, function(err, user) {
    if (err) return done(err);

    // if a user has been found, then someone already has this email address as their primary 
    // account, to proceed that user must delete the account where this email is primary, so let's bail
    if (user) {
      request.flash('error', 'An account already has this email address as it\'s primary email.  That other account needs deleting before the address can be added to this account.');
      return response.redirect('/user/profile');
    }

    // yay!  We're good to go ahead and save this!
    shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

    var user = request.user,
        token = shortid.generate();

    if (request.body.additional_email_1) {
      var additionalEmailAddress = request.body.additional_email_1;
      user.attributes.additional_email_1 = request.body.additional_email_1;
      user.attributes.additional_email_1_is_verified = false;
      user.attributes.additional_email_1_verification_code = token;
    } else if (request.body.additional_email_2) {
      var additionalEmailAddress = request.body.additional_email_2;
      user.attributes.additional_email_2 = request.body.additional_email_2;
      user.attributes.additional_email_2_is_verified = false;
      user.attributes.additional_email_2_verification_code = token;
    }

    user.attributes.updated_at = new Date().getTime();

    user.save(function(err) {
      // send email
      var mailOptions = {
        to: additionalEmailAddress,
        from: 'no-reply@backpack.openbadges.org',
        subject: 'Mozilla Openbadges Backpack Email Verification',
        text: 'You are receiving this because you (or someone else) has added this email address to a Backpack account.\n\n' +
          'If you didn\'t add an additional email to your Backpack account, you can safely ignore this email.\n\n' +
          'If you did, then please copy the following code and paste it into the verification form on your Backpack User Profile page.  ' + 
          ' Once you have taken this step, you will then be able to use this email address to login to the Backpack.\n\n' +
          'CODE:  ' + token + '\n\n'
      };
      smtpTrans.sendMail(mailOptions, function(err) {
        response.render('user-profile.html', {
          success: ['Additional email has been added successfully, please complete the verification process'],
          csrfToken: request.csrfToken(),
          user: request.user,
        });
      });
    });

  });

};


exports.sendEmailAddressVerificationEmailPost = function sendEmailAddressVerificationEmailPost(request, response) {

  if (!request.user) {
    return response.redirect(303, '/');
  }

  // yay!  We're good to go ahead and save this!
  shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

  var user = request.user,
      token = shortid.generate();

  user.attributes.email_is_verified = false;
  user.attributes.email_verification_code = token;

  user.attributes.updated_at = new Date().getTime();

  user.save(function(err) {
    // send email
    var mailOptions = {
      to: user.attributes.email,
      from: 'no-reply@backpack.openbadges.org',
      subject: 'Mozilla Openbadges Backpack Email Verification',
      text: 'You are receiving this because you (or someone else) has requested to verify this email address with the associated Backpack account.\n\n' +
        'Please login to the Backpack and copy the following code and paste it into the verification form on your Backpack User Profile page.  ' + 
        'CODE:  ' + token + '\n\n'
    };
    smtpTrans.sendMail(mailOptions, function(err) {
      response.render('user-profile.html', {
        success: ['Verification email has been sent successfully, please check your inbox!'],
        csrfToken: request.csrfToken(),
        user: request.user,
      });
    });

    return response.json(200, {'status':'ok'});
  });

};


/**
 * Remove additional email from the the user profile page.
 */

exports.profileRemoveAdditionalEmailPost = function profileRemoveAdditionalEmailPost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  var user = request.user;

  if (request.body.additional_email_1) {
    removedEmail = request.user.additional_email_1;
    user.attributes.additional_email_1 = null;
    user.attributes.additional_email_1_is_verified = false;
    user.attributes.additional_email_1_verification_code = null;
  } else if (request.body.additional_email_2) {
    removedEmail = request.user.additional_email_2;
    user.attributes.additional_email_2 = null;
    user.attributes.additional_email_2_is_verified = false;
    user.attributes.additional_email_2_verification_code = null;
  }

  user.attributes.updated_at = new Date().getTime();

  // remove bpc_sessions here

  user.save(function(err) {
    response.render('user-profile.html', {
      success: ['Additional email has been remove successfully'],
      csrfToken: request.csrfToken(),
      user: request.user,
    });
  });

};


/**
 * Verify email address.
 */

exports.verifyEmailPost = function verifyEmailPost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  if (request.body.email) {
    emailToVerify = 'email';
  } else if (request.body.additional_email_1) {
    emailToVerify = 'additional_email_1';
  } else {
    emailToVerify = 'additional_email_2';
  }

  if (request.body[emailToVerify + '_verification_code'] == request.user.attributes[emailToVerify + '_verification_code']) {
    async.waterfall([
      function(done) {

        // if this is a primary email we're verifying, then no other account can have the same primary account email address, so let's continue on
        if (emailToVerify == 'email') {
          done();
        } else {
          User.findOne({ email : request.body[emailToVerify] }, function(err, user) {
            if (err) return done(err);
            // if a user has been found, then someone already has this email address as their primary 
              // account, to proceed that user must delete the account where this email is primary, so let's bail
            if (user) {
              request.flash('error', 'An account already has this email address as it\'s primary email.  That other account needs deleting before the address can be verified on this account.');
              return response.redirect('/user/profile');
            } else {
              done();
            }

          });
        }

      },
      function(done) {
       
        User.find({ additional_email_1 : request.body[emailToVerify] }, function(err, users) {
          if (err) return done(err);
          // if users have been found with this email address as their additional_email_1, then let's unverify them
          if (users.length) {
            for (var i = users.length - 1; i >= 0; i--) {
              if (request.user.attributes.id != users[i].attributes.id) {
                users[i].attributes.additional_email_1_is_verified = false;
                users[i].attributes.additional_email_1_verification_code = null;
                users[i].attributes.updated_at = new Date().getTime();
                users[i].save();
              }
              if (i == 0) {
                done();
              }
            }
          } else {
            done();
          }
        });

      },
      function(done) {
        
        User.find({ additional_email_2 : request.body[emailToVerify] }, function(err, users) {
          if (err) return done(err);
          // if users have been found with this email address as their additional_email_2, then let's unverify them
          if (users.length) {
            for (var i = users.length - 1; i >= 0; i--) {
              if (request.user.attributes.id != users[i].attributes.id) {
                users[i].attributes.additional_email_2_is_verified = false;
                users[i].attributes.additional_email_2_verification_code = null;
                users[i].attributes.updated_at = new Date().getTime();
                users[i].save();
              }
              if (i == 0) {
                done();
              }
            }
          } else {
            done();
          }
        });

      },
      function(done) {

        var user = request.user;
        user.attributes[emailToVerify + '_is_verified'] = true;
        user.attributes.updated_at = new Date().getTime();
        user.save(function(err) {
          request.flash('success', 'Email verification was successful');
          return response.redirect('/user/profile');
        });

      }
    ], function(err) {
      response.redirect('/user/profile');
    });
  } else {
    request.flash('error', 'Email verification failed.  Incorrect code provided.');
    return response.redirect('/user/profile');
  }

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
    success: request.flash('success'),
    info: request.flash('info'),
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
          siteUrl + '/password/reset/' + token + '\n\n' +
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
      success: request.flash('success'),
      info: request.flash('info'),
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


/**
 * Request account deletion code.
 */

exports.requestAccountDeletionCodePost = function requestAccountDeletionCodePost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  // yay!  We're good to go ahead and save this!
  shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

  var user = request.user,
      token = shortid.generate();

  user.attributes.delete_account_code_requested = true;
  user.attributes.delete_account_code = token;
  user.attributes.updated_at = new Date().getTime();

  user.save(function(err) {
    // send email
    var mailOptions = {
      to: user.attributes.email,
      from: 'no-reply@backpack.openbadges.org',
      subject: 'Mozilla Openbadges Backpack Account Deletion Code',
      text: 'You are receiving this because you (or someone else) has requested a deletion code for the Backpack account associated to this email address.\n\n' +
        'If you didn\'t request this code, you can safely ignore this email.\n\n' +
        'If you did, then please copy the following code and paste it into the deletion form on your Backpack User Profile page.  ' + 
        ' Once you have taken this step, you will then be able to delete your Backpack account.\n\n' +
        'CODE:  ' + token + '\n\n'
    };
    smtpTrans.sendMail(mailOptions, function(err) {
      request.flash('success', 'Account deletion code has been sent successfully, please check your inbox!');
      return response.redirect('/user/profile');
    });
  });
}


/**
 * YIKES!... DELETE ACCOUNT!
 */

exports.deleteAccountPost = function deleteAccountPost(request, response) {
  if (!request.user) {
    return response.redirect(303, '/');
  }

  var user = request.user;

  if (!user.attributes.delete_account_code_requested) {
    request.flash('error', 'No account deletion code has been requested for this account.');
    return response.redirect('/user/profile');
  }

  if (user.attributes.delete_account_code != request.body.delete_account_code) {
    request.flash('error', 'Incorrect account deletion code provided.');
    return response.redirect('/user/profile');
  }

  async.series([
    function destroyBadgeImages(done) {
      user.getAllBadges(function(err, badges) {
        if (err) {
          request.flash('error', 'There was a problem getting badge images to delete for this account.');
          return response.redirect('/user/profile');
        }

        var criteria = {
          key: 'badge_hash',
          values: []
        };

        if (badges.length) {
          for (var i = badges.length - 1; i >= 0; i--) {

            criteria.values.push("'" + badges[i].get('body_hash') + "'");
           
            if (i == 0) {
              BadgeImage.findAndDestroyIn(criteria, done);
            }
          }
        } else {
          done(null);
        }
      });
    },
    function destroyBadges(done) {
      user.getAllBadges(function(err, badges) {
        if (err) {
          request.flash('error', 'There was a problem getting badges to delete for this account.');
          return response.redirect('/user/profile');
        }

        var criteria = {
          key: 'id',
          values: []
        };

        if (badges.length) {
          for (var i = badges.length - 1; i >= 0; i--) {

            criteria.values.push("'" + badges[i].get('id') + "'");
           
            if (i == 0) {
              Badge.findAndDestroyIn(criteria, done);
            }
          }
        } else {
          done(null);
        }
      });
    },
    function destroyConnectSessions(done) {
      Session.findAndDestroy({ user_id: user.attributes.id }, done);
    },
    function destroyPortfolios(done) {
      Group.find({ user_id: user.attributes.id }, function(err, groups) {
        if (err) {
          request.flash('error', 'There was a problem getting groups to delete for this account.');
          return response.redirect('/user/profile');
        }

        var criteria = {
          key: 'group_id',
          values: []
        };

        if (groups.length) {
          for (var i = groups.length - 1; i >= 0; i--) {

            criteria.values.push("'" + groups[i].get('id') + "'");
           
            if (i == 0) {
              Portfolio.findAndDestroyIn(criteria, function(err) {
                done(err);
              });
            }
          }
        } else {
          done(null);
        }

      });
    },
    function destroyGroups(done) {
      Group.findAndDestroy({ user_id: user.attributes.id }, done);
    },
    function destroyUser(done) {
      user.destroy(function(err) {
        done(err);
      });
    }
  ], function (err) {
    if (err) {
      request.flash('error', 'There was a problem deleting this account.');
      return response.redirect('/user/profile');
    }

    request.session = null;
    return response.redirect(303, '/backpack/login#solongandthanksforallthefish');
  });

}
