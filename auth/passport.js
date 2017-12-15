// load all the things we need
var LocalStrategy      = require('passport-local').Strategy;
var FacebookStrategy   = require('passport-facebook').Strategy;
var TwitterStrategy    = require('passport-twitter').Strategy;
var GoogleStrategy     = require('passport-google-oauth').OAuth2Strategy;
var DeviantArtStrategy = require('passport-deviantart').Strategy;
var BearerStrategy     = require('passport-http-bearer-base64').Strategy;
var PersonaStrategy    = require('passport-persona').Strategy;

// load up the user model
var User = require('../models/user');
var Session = require('../models/backpack-connect').Session;

// load up our trusty password strength checker, courtesy of the sec experts over at owasp
var owasp = require('owasp-password-strength-test');

const nodemailer = require('nodemailer');
const smtpTransport = require("nodemailer-smtp-transport");

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

const shortid = require('shortid');


module.exports = function(passport, configuration) {

    // load the auth variables for third-party strategies other than persona
    // var configAuth = configuration.get('passportStrategyConfigs');

    // =========================================================================
    // PASSPORT SESSION SETUP ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users in/out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // We only really need Persona for migration purposes, so other parts of the app
    // that require passport may not pass the config in, in which case skip this code
    if (configuration) {

        // prepare siteUrl for Persona audience
        var siteUrl = configuration.get('protocol') + '://' + configuration.get('hostname');
        var port = configuration.get('port');
        if ((process.env.NODE_ENV !== 'heroku') && (port !== 80) && (port !== 443)) {
            siteUrl = siteUrl + ':' + port;
        }

        // =========================================================================
        // PERSONA LOGIN ===========================================================
        // =========================================================================
        passport.use(new PersonaStrategy({
            audience: siteUrl,
            passReqToCallback : true
        },
        function(request, email, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function() {
                User.findOne({ email :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user) {
                        // USER DIDN'T NEED TO MIGRATE, AS THEY NEVER HAD AN ACCOUNT!
                        // MAKE NEW USER ACCOUNT & SEND USER SIGNUP/MIGRATION EMAIL ANYWAY
                        request.flash('error', 'The email address used has no Backpack account.  Please sign up for a new account.');
                        return done(null);

                    } else {
                        // FOUND USER ACCOUNT... LET'S GET THEM MIGRATED!
                        return done(null, user.attributes);
                    }
                });

            });
        }));
    }

    // =========================================================================
    // HTTP BEARER TOKEN LOGIN =================================================
    // =========================================================================
    passport.use('bearer', new BearerStrategy({
            passReqToCallback  : true,
            base64EncodedToken : true
        },
        function(req, token, done) {
            Session.findOne({ access_token: token }, function (err, session) {
                if (err) { return done(err); }
                if (!session) { return done(null, false); }

                User.findById(session.attributes.user_id, function(err, user) {
                    if (err) { return done(err); }
                    if (!user) { return done(null, false); }
                    req.bpc_session = session;
                    return done(null, user, { scope: 'all' });
                });
            });
        }
    ));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            User.findOne({ email :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err) {
                    return done(err);
                }

                // if no user is found, check additional emails (some serious nesting going on here), if ultimately no user is found there then return an error message
                if (!user) {

                    // additional email #1
                    return User.findOne({ additional_email_1 :  email, additional_email_1_is_verified: true }, function(err, user) {
                        // if there are any errors, return the error
                        if (err) {
                            return done(err);
                        }

                        // if no user is found, check additional_email_1, if no user is found there then return error message
                        if (!user) {

                            // additional email #2
                            return User.findOne({ additional_email_2 :  email, additional_email_2_is_verified: true }, function(err, user) {
                                // if there are any errors, return the error
                                if (err) {
                                    return done(err);
                                }

                                // if no user is found, check additional_email_1, if no user is found there then return error message
                                if (!user) {
                                    return done(null, false, req.flash('error', 'No user found.'));
                                }

                                if (!user.validPassword(password)) {
                                    return done(null, false, req.flash('error', 'Oops! Wrong password.'));

                                // all is well, return user
                                } else {
                                    req.user = user;
                                    user.setLoginDate();
                                    user.save(function(err) {
                                        if (err)
                                            return done(err);

                                        return done(null, user.attributes);
                                    });
                                }
                            });
                        }

                        if (!user.validPassword(password)) {
                            return done(null, false, req.flash('error', 'Oops! Wrong password.'));

                        // all is well, return user
                        } else {
                            req.user = user;
                            user.setLoginDate();
                            user.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, user.attributes);
                            });
                        }
                    });
                }

                if (!user.validPassword(password)) {
                    return done(null, false, req.flash('error', 'Oops! Wrong password.'));

                // all is well, return user
                } else {
                    req.user = user;
                    user.setLoginDate();
                    user.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, user.attributes);
                    });
                }
            });

        });

    }));


    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                User.findOne({ email :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check if the password is secure
                    var result = owasp.test(password);

                    if (result.errors.length > 0) {
                      return done(null, false, req.flash('error', result.errors));
                    }

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('error', 'That email is already taken.'));
                    } else {

                        // check additional email 1
                        User.findOne({ additional_email_1: email, additional_email_1_is_verified: true }, function(err, user) {
                            // if there are any errors, return the error
                            if (err)
                                return done(err);

                            if (user) {
                                return done(null, false, req.flash('error', 'That email is already taken.'));
                            } else {

                                // check additional email 2
                                User.findOne({ additional_email_2: email, additional_email_2_is_verified: true }, function(err, user) {
                                    // if there are any errors, return the error
                                    if (err)
                                        return done(err);

                                    if (user) {
                                        return done(null, false, req.flash('error', 'That email is already taken.'));
                                    } else {

                                        shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

                                        var createdAt = new Date().getTime(),
                                            token = shortid.generate();

                                        // create the user
                                        var newUser = new User({
                                            first_name: req.body.first_name,
                                            last_name: req.body.last_name,
                                            email: email,
                                            active: 1,
                                            created_at: createdAt,
                                            updated_at: createdAt,
                                            email_is_verified: false,
                                            email_verification_code: token,
                                        });

                                        newUser.attributes.password = newUser.generateHash(password);

                                        newUser.save(function(err) {
                                            if (err)
                                                return done(err);

                                            // send email
                                            var mailOptions = {
                                                to: email,
                                                from: 'no-reply@backpack.openbadges.org',
                                                subject: 'Welcome to the Mozilla Openbadges Backpack',
                                                text: 'You are receiving this because you (or someone else) has created a Backpack account with this email address.\n\n' +
                                                    'If you actioned this, then please login to the Backpack, copy the following code and paste it into the verification form on your Backpack User Profile page.  ' + 
                                                    'CODE:  ' + token + '\n\n'
                                            };

                                            smtpTrans.sendMail(mailOptions, function(err) {
                                                return done(null, newUser.attributes);
                                            });
                                            
                                        });
                                    }
                                });

                            }
                        });
                    }

                });
            // if the user is logged in but has no local account...
            } else if ( !req.user.local.email ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account is being used by another user
                User.findOne({ email :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    
                    if (user) {
                        return done(null, false, req.flash('error', 'That email is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            
                            return done(null,user.attributes);
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }

        });

    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    // passport.use(new FacebookStrategy({

    //     clientID        : configAuth.facebookAuth.clientID,
    //     clientSecret    : configAuth.facebookAuth.clientSecret,
    //     callbackURL     : configAuth.facebookAuth.callbackURL,
    //     passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    // },
    // function(req, token, refreshToken, profile, done) {

    //     // asynchronous
    //     process.nextTick(function() {

    //         // check if the user is already logged in
    //         if (!req.user) {

    //             User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
    //                 if (err)
    //                     return done(err);

    //                 if (user) {

    //                     // if there is a user id already but no token (user was linked at one point and then removed)
    //                     if (!user.facebook.token) {
    //                         user.facebook.token = token;
    //                         user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
    //                         user.facebook.email = (profile.emails[0].value || '').toLowerCase();

    //                         user.save(function(err) {
    //                             if (err)
    //                                 return done(err);
                                    
    //                             return done(null, user);
    //                         });
    //                     }

    //                     return done(null, user); // user found, return that user
    //                 } else {
    //                     // if there is no user, create them
    //                     var newUser            = new User();

    //                     newUser.facebook.id    = profile.id;
    //                     newUser.facebook.token = token;
    //                     newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
    //                     newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();

    //                     newUser.save(function(err) {
    //                         if (err)
    //                             return done(err);
                                
    //                         return done(null, newUser);
    //                     });
    //                 }
    //             });

    //         } else {
    //             // user already exists and is logged in, we have to link accounts
    //             var user            = req.user; // pull the user out of the session

    //             user.facebook.id    = profile.id;
    //             user.facebook.token = token;
    //             user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
    //             user.facebook.email = (profile.emails[0].value || '').toLowerCase();

    //             user.save(function(err) {
    //                 if (err)
    //                     return done(err);
                        
    //                 return done(null, user);
    //             });

    //         }
    //     });

    // }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    // passport.use(new TwitterStrategy({

    //     consumerKey     : configAuth.twitterAuth.consumerKey,
    //     consumerSecret  : configAuth.twitterAuth.consumerSecret,
    //     callbackURL     : configAuth.twitterAuth.callbackURL,
    //     passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    // },
    // function(req, token, tokenSecret, profile, done) {

    //     // asynchronous
    //     process.nextTick(function() {

    //         // check if the user is already logged in
    //         if (!req.user) {

    //             User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
    //                 if (err)
    //                     return done(err);

    //                 if (user) {
    //                     // if there is a user id already but no token (user was linked at one point and then removed)
    //                     if (!user.twitter.token) {
    //                         user.twitter.token       = token;
    //                         user.twitter.username    = profile.username;
    //                         user.twitter.displayName = profile.displayName;

    //                         user.save(function(err) {
    //                             if (err)
    //                                 return done(err);
                                    
    //                             return done(null, user);
    //                         });
    //                     }

    //                     return done(null, user); // user found, return that user
    //                 } else {
    //                     // if there is no user, create them
    //                     var newUser                 = new User();

    //                     newUser.twitter.id          = profile.id;
    //                     newUser.twitter.token       = token;
    //                     newUser.twitter.username    = profile.username;
    //                     newUser.twitter.displayName = profile.displayName;

    //                     newUser.save(function(err) {
    //                         if (err)
    //                             return done(err);
                                
    //                         return done(null, newUser);
    //                     });
    //                 }
    //             });

    //         } else {
    //             // user already exists and is logged in, we have to link accounts
    //             var user                 = req.user; // pull the user out of the session

    //             user.twitter.id          = profile.id;
    //             user.twitter.token       = token;
    //             user.twitter.username    = profile.username;
    //             user.twitter.displayName = profile.displayName;

    //             user.save(function(err) {
    //                 if (err)
    //                     return done(err);
                        
    //                 return done(null, user);
    //             });
    //         }

    //     });

    // }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    // passport.use(new GoogleStrategy({

    //     clientID        : configAuth.googleAuth.clientID,
    //     clientSecret    : configAuth.googleAuth.clientSecret,
    //     callbackURL     : configAuth.googleAuth.callbackURL,
    //     passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    // },
    // function(req, token, refreshToken, profile, done) {

    //     // asynchronous
    //     process.nextTick(function() {

    //         // check if the user is already logged in
    //         if (!req.user) {

    //             User.findOne({ 'google.id' : profile.id }, function(err, user) {
    //                 if (err)
    //                     return done(err);

    //                 if (user) {

    //                     // if there is a user id already but no token (user was linked at one point and then removed)
    //                     if (!user.google.token) {
    //                         user.google.token = token;
    //                         user.google.name  = profile.displayName;
    //                         user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

    //                         user.save(function(err) {
    //                             if (err)
    //                                 return done(err);

    //                             return done(null, user);
    //                         });
    //                     }

    //                     return done(null, user);
    //                 } else {
    //                     var newUser          = new User();

    //                     newUser.google.id    = profile.id;
    //                     newUser.google.token = token;
    //                     newUser.google.name  = profile.displayName;
    //                     newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

    //                     newUser.save(function(err) {
    //                         if (err)
    //                             return done(err);
                                
    //                         return done(null, newUser);
    //                     });
    //                 }
    //             });

    //         } else {
    //             // user already exists and is logged in, we have to link accounts
    //             var user               = req.user; // pull the user out of the session

    //             user.google.id    = profile.id;
    //             user.google.token = token;
    //             user.google.name  = profile.displayName;
    //             user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

    //             user.save(function(err) {
    //                 if (err)
    //                     return done(err);
                        
    //                 return done(null, user);
    //             });

    //         }

    //     });

    // }));


    // =========================================================================
    // DEVIANTART ==============================================================
    // =========================================================================
    // passport.use(new DeviantArtStrategy({

    //     clientID        : configAuth.deviantArt.clientID,
    //     clientSecret    : configAuth.deviantArt.clientSecret,
    //     callbackURL     : configAuth.deviantArt.callbackURL,
    //     passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    // },
    // function(req, token, refreshToken, profile, done) {

    //     // asynchronous
    //     process.nextTick(function() {

    //         // check if the user is already logged in
    //         if (!req.user) {

    //             User.findOne({ 'deviantart.id' : profile.id }, function(err, user) {
    //                 if (err)
    //                     return done(err);

    //                 if (user) {

    //                     // if there is a user id already but no token (user was linked at one point and then removed)
    //                     if (!user.deviantart.token) {
    //                         user.deviantart.token = token;
    //                         user.deviantart.id  = profile.id;
    //                         user.deviantart.username = profile.username;

    //                         user.save(function(err) {
    //                             if (err)
    //                                 return done(err);
                                    
    //                             return done(null, user);
    //                         });
    //                     }

    //                     return done(null, user);
    //                 } else {
    //                     var newUser          = new User();

    //                     newUser.deviantart.token = token;
    //                     newUser.deviantart.id    = profile.id;
    //                     newUser.deviantart.username  = profile.username;

    //                     newUser.save(function(err) {
    //                         if (err)
    //                             return done(err);
                                
    //                         return done(null, newUser);
    //                     });
    //                 }
    //             });

    //         } else {
    //             // user already exists and is logged in, we have to link accounts
    //             var user               = req.user; // pull the user out of the session

    //             user.deviantart.id    = profile.id;
    //             user.deviantart.token = token;
    //             user.deviantart.username  = profile.username;

    //             user.save(function(err) {
    //                 if (err)
    //                     return done(err);
                        
    //                 return done(null, user);
    //             });

    //         }

    //     });

    // }));

};
