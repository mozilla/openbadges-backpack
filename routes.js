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

  app.get('/baker', baker.baker);
  app.get('/issuer.js', issuer.generateScript);
  app.get('/issuer/frame', issuer.frame);
  app.post('/issuer/frameless', issuer.frameless);
  app.get('/issuer/assertion', issuer.issuerBadgeAddFromAssertion);
  app.post('/issuer/assertion', issuer.issuerBadgeAddFromAssertion);
  app.get('/issuer/welcome', issuer.welcome);

  app.get('/displayer/convert/email', displayer.emailToUserIdView);
  app.post('/displayer/convert/email', displayer.emailToUserId);
  app.get('/displayer/:apiUserId/groups.:format?', displayer.userGroups);
  app.get('/displayer/:apiUserId/group/:apiGroupId.:format?', displayer.userGroupBadges);

  app.get('/demo', demo.issuer);
  app.get('/demo/ballertime', demo.massAward);
  app.get('/demo/badge.json', demo.demoBadge);
  app.get('/demo/invalid.json', demo.badBadge);
  app.post('/demo/award', demo.award);

  // app.get('/', passport.authenticate('bearer', { session: false }), backpack.recentBadges);
  app.get('/', backpack.recentBadges);
  app.get('/backpack', backpack.manage);
  app.get('/backpack/badges', backpack.allBadges);
  app.get('/backpack/add', csrfProtection, backpack.addBadge);
  app.get('/backpack/welcome', csrfProtection, backpack.welcome);
  app.get('/backpack/login', csrfProtection, backpack.login);
  app.post('/backpack/login', parseForm, csrfProtection, passport.authenticate('local-login', {
      successRedirect : '/', // redirect to the secure profile section
      failureRedirect : '/backpack/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));
  app.get('/backpack/signup', csrfProtection, backpack.signup);
  app.post('/backpack/signup', parseForm, csrfProtection, passport.authenticate('local-signup', {
      successRedirect : '/', // redirect to the secure profile section
      failureRedirect : '/backpack/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));
  app.get('/backpack/signout', backpack.signout);
  app.post('/backpack/badge', parseForm, csrfProtection, backpack.userBadgeUpload);

  app.get('/user/profile', csrfProtection, user.profile);
  app.post('/user/profile', parseForm, csrfProtection, user.profilePost);
  app.get('/password/reset', csrfProtection, user.requestReset);
  app.post('/password/reset', parseForm, csrfProtection, user.requestResetPost);
  app.get('/password/reset/:token', csrfProtection, user.reset);
  app.post('/password/update', parseForm, csrfProtection, user.resetPost);

  app.post('/backpack/authenticate', backpack.authenticate);

  app.post('/auth/browserid', parseForm, csrfProtection, passport.authenticate('persona', {
    failureRedirect: '/backpack/login' }), function(req, res) {
    req.session = null;
    res.redirect('/migration-instructions');
  });
  app.get('/migration-instructions', function(req, res) {
    return res.render('migration-instructions.html', {});
  });

  app.get('/backpack/settings', backpack.settings());
  app.post('/backpack/settings/revoke-origin', backpackConnect.revokeOrigin());
  app.get('/stats', backpack.stats);
  app.get('/backpack/badge/:badgeId', backpack.details);
  app.delete('/backpack/badge/:badgeId', backpack.deleteBadge);

  app.delete('/badge/:badgeId', badge.destroy);

  app.post('/group', group.create);
  app.put('/group/:groupId', group.update);
  app.delete('/group/:groupId', group.destroy);

  app.get('/images/badge/:badgeHash.:badgeFileType', badge.image);

  app.post('/share/badge/:badgeId', badge.share);
  app.get('/share/badge/:badgeUrl', badge.show);

  app.get('/share/:groupUrl/edit', csrfProtection, share.editor);
  app.post('/share/:groupUrl', parseForm, csrfProtection, share.createOrUpdate);
  app.put('/share/:groupUrl', share.createOrUpdate);
  app.get('/share/:groupUrl', csrfProtection, share.show);

  app.get('/privacy.html', function(req, res) { return res.render('privacy.html', {}); });
  app.get('/tou.html', function(req, res) { return res.render('tou.html', {}); });
  app.get('/vpat.html', function(req, res) { return res.render('vpat.html', {}); });

  app.get('/access', csrfProtection, backpackConnect.requestAccess());
  app.post('/accept', parseForm, csrfProtection, backpackConnect.allowAccess());

  app.all('/api/*', backpackConnect.allowCors());
  app.post('/api/token', backpackConnect.refresh());
  app.post('/api/issue', backpackConnect.authorize("issue"),
                         issuer.issuerBadgeAddFromAssertion);
  app.get('/api/identity', backpackConnect.authorize("issue"),
                           backpackConnect.hashIdentity());

};
