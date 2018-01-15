module.exports = function(app, passport, parseForm, csrfProtection) {

  const baker = require('./controllers/baker');
  const badge = require('./controllers/badge');
  const issuer = require('./controllers/issuer');
  const displayer = require('./controllers/displayer');
  const demo = require('./controllers/demo');
  const backpack = require('./controllers/backpack');
  const user = require('./controllers/user');
  const group = require('./controllers/group');
  const share = require('./controllers/share');
  const BackpackConnect = require('./controllers/backpack-connect');
  const backpackConnect = new BackpackConnect({
    apiRoot: '/api',
    realm: 'openbadges'
  });

  // Parameter handlers
  app.param('badgeId', badge.findById);
  app.param('apiUserId', displayer.findUserById);
  app.param('apiGroupId', displayer.findGroupById);
  app.param('groupId', group.findById);
  app.param('groupUrl', share.findGroupByUrl);
  app.param('badgeUrl', badge.findByUrl);
  app.param('badgeHash', badge.findByHash);

  // Badge baking and issuer
  app.get('/baker', csrfProtection, baker.baker);
  app.get('/issuer.js', csrfProtection, issuer.generateScript);
  app.get('/issuer/frame', csrfProtection, issuer.frame);
  app.post('/issuer/frameless', parseForm, csrfProtection, issuer.frameless);
  app.get('/issuer/assertion', csrfProtection, issuer.issuerBadgeAddFromAssertion);
  app.post('/issuer/assertion', parseForm, issuer.issuerBadgeAddFromAssertion);
  app.get('/issuer/welcome', csrfProtection, issuer.welcome);

  // Displayer
  app.get('/displayer/convert/email', csrfProtection, displayer.emailToUserIdView);
  app.post('/displayer/convert/email', parseForm, displayer.emailToUserId);
  app.get('/displayer/:apiUserId/groups.:format?', csrfProtection, displayer.userGroups);
  app.get('/displayer/:apiUserId/group/:apiGroupId.:format?', csrfProtection, displayer.userGroupBadges);

  // Demo pages/functions
  app.get('/demo', csrfProtection, demo.issuer);
  app.get('/demo/ballertime', csrfProtection, demo.massAward);
  app.get('/demo/badge.json', csrfProtection, demo.demoBadge);
  app.get('/demo/invalid.json', csrfProtection, demo.badBadge);
  app.post('/demo/award', parseForm, demo.award);

  // Backpack
  app.get('/', csrfProtection, backpack.recentBadges);
  app.get('/backpack', csrfProtection, backpack.manage);
  app.get('/backpack/badges', csrfProtection, backpack.allBadges);
  app.get('/backpack/add', csrfProtection, backpack.addBadge);
  app.get('/backpack/welcome', csrfProtection, backpack.welcome);
  app.get('/backpack/login', csrfProtection, backpack.login); // normal login
  app.post('/backpack/login', parseForm, csrfProtection, passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/backpack/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));
  app.post('/backpack/login/ajax', parseForm, csrfProtection, function(req, res, next) { // ajax login
    passport.authenticate('local-login', function(err, user, info) {
      if (err) { return res.json(400, err); }
      if (!user) {
        return res.json(200, {
          message: "Login failed, please try again"
        });
      }
      req.logIn(user, function(err) {
        if (err) { return res.json(400, err); }
        return res.json(200, {
          message: 'You have successfully logged in',
          email: user.email
        });
      });
    })(req, res, next);
  });
  app.get('/backpack/signup', csrfProtection, backpack.signup);
  app.post('/backpack/signup', parseForm, csrfProtection, passport.authenticate('local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/backpack/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));
  app.get('/backpack/signout', csrfProtection, backpack.signout);
  app.post('/backpack/badge', parseForm, csrfProtection, backpack.userBadgeUpload);

  // User profile and password functionality
  app.get('/user/profile', csrfProtection, user.profile);
  app.post('/user/profile/change-password', parseForm, csrfProtection, user.profileChangePasswordPost);
  app.post('/user/profile/update-name', parseForm, csrfProtection, user.profileUpdateNamePost);
  app.post('/user/profile/add-additional-email', parseForm, csrfProtection, user.profileAddAdditionalEmailPost);
  app.post('/user/profile/remove-additional-email', parseForm, csrfProtection, user.profileRemoveAdditionalEmailPost);
  app.post('/user/profile/send-email-address-verification-email', parseForm, csrfProtection, user.sendEmailAddressVerificationEmailPost);
  app.post('/user/profile/verify-email', parseForm, csrfProtection, user.verifyEmailPost);
  app.post('/user/profile/request-account-deletion-code', parseForm, csrfProtection, user.requestAccountDeletionCodePost);
  app.post('/user/profile/delete-account', parseForm, csrfProtection, user.deleteAccountPost);
  app.get('/password/reset', csrfProtection, user.requestReset);
  app.post('/password/reset', parseForm, csrfProtection, user.requestResetPost);
  app.get('/password/reset/:token', csrfProtection, user.reset);
  app.post('/password/update', parseForm, csrfProtection, user.resetPost);

  // Persona authentication process (old)
  app.post('/backpack/authenticate', backpack.authenticate);

  // Persona authentication process (new - for migration)
  app.post('/auth/browserid', parseForm, csrfProtection, passport.authenticate('persona', {
    failureRedirect: '/backpack/login' }), function(req, res) {
    res.redirect('/migration-step-1');
  });
  app.get('/migration-step-1', csrfProtection, user.migrate);
  app.post('/migration-step-1', parseForm, csrfProtection, user.migratePost);
  app.get('/migration-step-2', function(req, res) {
    return res.render('migration-step-2.html', {});
  });
  app.get('/migration/verify/:token', csrfProtection, user.migrateVerify);
  app.post('/migration-step-3', parseForm, csrfProtection, user.migrateVerifyPost);

  // Backpack settings
  app.get('/backpack/settings', csrfProtection, backpack.settings());
  app.post('/backpack/settings/revoke-origin', parseForm, csrfProtection, backpackConnect.revokeOrigin());

  // Statistics
  app.get('/stats', csrfProtection, backpack.stats);

  // Badge deletion
  app.get('/backpack/badge/:badgeId', csrfProtection, backpack.details);
  app.delete('/backpack/badge/:badgeId', backpack.deleteBadge);
  app.delete('/badge/:badgeId', badge.destroy);

  // Badge groups
  app.post('/group', parseForm, group.create);
  app.put('/group/:groupId', group.update);
  app.delete('/group/:groupId', group.destroy);

  app.get('/images/badge/:badgeHash.:badgeFileType', csrfProtection, badge.image);

  // Badge and group sharing
  app.post('/share/badge/:badgeId', parseForm, badge.share);
  app.get('/share/badge/:badgeUrl', csrfProtection, badge.show);
  app.get('/share/:groupUrl/edit', csrfProtection, share.editor);
  app.post('/share/:groupUrl', parseForm, csrfProtection, share.createOrUpdate);
  app.put('/share/:groupUrl', share.createOrUpdate);
  app.get('/share/:groupUrl', csrfProtection, share.show);

  // Legal pages
  app.get('/privacy.html', function(req, res) { return res.render('privacy.html', {legalNav: true}); });
  app.get('/tou.html', function(req, res) { return res.render('tou.html', {legalNav: true}); });
  app.get('/vpat.html', function(req, res) { return res.render('vpat.html', {legalNav: true}); });

  // Backpack Connect request access
  app.get('/access', csrfProtection, backpackConnect.requestAccess());
  app.post('/accept', parseForm, csrfProtection, backpackConnect.allowAccess());

  // Backpack Connect API
  app.post('/api/token', parseForm, backpackConnect.refresh()); // excluded from bearer auth
  app.all('/api/*', passport.authenticate('bearer', { session: false }), backpackConnect.allowCors());
  app.post('/api/issue', passport.authenticate('bearer', { session: false }), parseForm, backpackConnect.authorize("issue"),
                         issuer.issuerBadgeAddFromAssertion);
  app.get('/api/identity', passport.authenticate('bearer', { session: false }), backpackConnect.authorize("issue"),
                           backpackConnect.hashIdentity());

};
