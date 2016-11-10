// load all the things we need
var LocalStrategy      = require('passport-local').Strategy;
var FacebookStrategy   = require('passport-facebook').Strategy;
var TwitterStrategy    = require('passport-twitter').Strategy;
var GoogleStrategy     = require('passport-google-oauth').OAuth2Strategy;
var DeviantArtStrategy = require('passport-deviantart').Strategy;
var BearerStrategy     = require('passport-http-bearer').Strategy;
var PersonaStrategy    = require('passport-persona').Strategy;

// load up the user model
var User = require('../models/user');
var Session = require('../models/backpack-connect').Session;

// load up our trusty password strength checker, courtesy of the sec experts over at owasp
var owasp = require('owasp-password-strength-test');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var smtpTransport = require("nodemailer-smtp-transport");

// temporary migration mail function
function sendMigrationEmail(mailerConfig, siteUrl, email, user, callback) {

    var smtpTrans = nodemailer.createTransport(smtpTransport({
        service: mailerConfig.service,
        auth: {
            user: mailerConfig.user,
            pass: mailerConfig.pass
        }
    }));

    // generate token
    crypto.randomBytes(32, function(err, buf) {

        var token = buf.toString('hex');

        // update user with token
        user.attributes.reset_password_token = token;
        user.attributes.reset_password_expires = Date.now() + (3600000 * 8); // 8 hour migration window
        user.attributes.updated_at = new Date().getTime();

        user.save(function(err) {
            // send email
            var mailOptions = {
                to: email,
                from: 'no-reply@backpack.openbadges.org',
                subject: 'Mozilla Openbadges Backpack Migration Instructions',
                text: 'You are receiving this because you (or someone else) have requested to migrate to the new Backpack account, from Persona (which is to be discontinued November 31st 2016).\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the migration and set your new backpack account password:\n\n' +
                  siteUrl + '/password/reset/' + token + '\n\n'
            };
            smtpTrans.sendMail(mailOptions, function(err) {
                callback();
            });
        });
    });
}

module.exports = function(passport, configuration) {

    // load the auth variables for third-party strategies other than persona
    // var configAuth = configuration.get('passportStrategyConfigs');

    // =========================================================================
    // passport session setup ==================================================
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

    var mailerConfig = configuration.get('mailer');
    var siteUrl = configuration.get('protocol') + '://' + configuration.get('hostname');
    var port = configuration.get('port');
    if ((process.env.NODE_ENV !== 'heroku') && (port !== 80) && (port !== 443)) {
        siteUrl = siteUrl + ':' + port;
    }

    console.log('AUDIENCE', siteUrl);

    passport.use(new PersonaStrategy({
        audience: siteUrl
    },
    function(email, done) {
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
                    console.log("MAKE NEW USER ACCOUNT & SEND USER SIGNUP/MIGRATION EMAIL");

                    var createdAt = new Date().getTime();

                    // create the user
                    var newUser = new User({
                        email: email,
                        active: 1,
                        created_at: createdAt,
                        updated_at: createdAt,
                    });

                    crypto.randomBytes(32, function(err, buf) {
                        var generatedPass = buf.toString('hex');

                        newUser.attributes.password = newUser.generateHash(generatedPass);

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            sendMigrationEmail(mailerConfig, siteUrl, email, newUser, function() {
                                return done(null, newUser.attributes);
                            });
                        });
                    });

                } else {
                    console.log("ALREADY MIGRATED! LOGIN USING NORMAL MECHANISM, ENSURE THEY HAVE THE MIGRATED FLAG SET");
                    sendMigrationEmail(mailerConfig, siteUrl, email, user, function() {
                        return done(null, user.attributes);
                    });
                }
            });

        });
    }));

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
                if (err)
                    return done(err);

                // if no user is found, return the message
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

                        var createdAt = new Date().getTime();

                        // create the user
                        var newUser = new User({
                            email: email,
                            active: 1,
                            created_at: createdAt,
                            updated_at: createdAt,
                        });

                        newUser.attributes.password = newUser.generateHash(password);

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser.attributes);
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
