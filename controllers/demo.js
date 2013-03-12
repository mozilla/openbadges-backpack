// Controller for providing metadata for & awarding demo badges.
var qs = require('querystring');
var fs = require('fs');
var path = require('path');
var configuration = require('../lib/configuration');
var request = require('request');
var awardBadge = require('../lib/award');
var logger = require('../lib/logging').logger;

var protocol = configuration.get('protocol') || 'http';
var port = configuration.get('port') || '';
var ORIGIN = protocol + '://' + configuration.get('hostname') + (port ? ':' + port : '');

// Render the view for the demo badge issuer.
exports.issuer = function (req, res) {
  res.render('issuer.html', {
    login: false,
    title: 'Demo Issuer',
    csrfToken: req.session._csrf
  });
};

// Bake & award a demo badge. Uses `demoBadge` below to generate a proper assertion.
exports.award = function (req, res) {
  var assertionURL = encodeURIComponent([ORIGIN + '/demo/badge.json', qs.stringify(req.body)].join('?'));
  var bakeURL = ORIGIN + '/baker?award=true&assertion=' + assertionURL;

  request({url: bakeURL, encoding: 'binary'},  function (err, resp, body) {
    res.send(Buffer(body, 'binary'), {'content-type': 'image/png'});
  });
};

exports.massAward = function (req, res) {
  if (!req.user) return res.send('nope');
  var demoBadgeDir = path.resolve(path.join(__dirname, '..', 'static', '_demo'));
  var email = req.user.get('email');
  var salt = 'ballertime';
  var hash = require('crypto').createHash('sha256').update(email + salt).digest('hex');
  var recipient = 'sha256$' + hash;

  fs.readdirSync(demoBadgeDir)
    .map(function (f) {
      var imgUrl = ORIGIN + '/static/_demo/' + f;
      var assertion = makeDemoAssertion(recipient, imgUrl);
      return {
        baseName: f,
        imgData: fs.readFileSync(path.join(demoBadgeDir, f)),
        assertion: assertion,
        assertionUrl: ORIGIN + '/demo/badge.json?' + qs.stringify({title: 'raaad', image: imgUrl, recipient: recipient})
      };
    })
    .forEach(function (item) {
      awardBadge({
        assertion: item.assertion,
        url: item.assertionUrl,
        public_path: [email, item.baseName].join(':'),
        imagedata: item.imgData,
        recipient: email
      }, function(err) {
        if (err)
          logger.debug('baller, please:', err.message);
      });
    });
  res.redirect('/', 303);
};

// Create a demo badge. Optionally override default values by providing GET
// params. This less an avenue for fraud than it might look: the name will
// always contain "DEMO" and the issuer will always be the backpack host.
exports.demoBadge = function (req, res) {
  var title = req.query.title;
  var desc = req.query.description;
  var recp = req.query.recipient || 'me@example.com';
  var image = req.query.image || '/images/demo-badge.png';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(makeDemoAssertion(recp, image, title, desc)));
};

// Send back a bad assertion after a timeout to simulate latency.
exports.badBadge = function (req, res) {
  setTimeout(function () {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({'this': 'is not a badge'}));
  }, 200);
};

function makeDemoAssertion(email, image, title, description) {
  return ({
    recipient: email,
    salt: 'ballertime',
    evidence: '/demo/evidence',
    expires: '2040-08-13',
    issued_on: '2011-08-23',
    badge: {
      version: 'v0.5.0',
      name: 'DEMO: ' + (title || 'Open Badges Demo Badge'),
      description: description || 'For rocking in the "free world"',
      image: image,
      criteria: '/demo/criteria',
      issuer: {
        name: 'Open Badges Demo',
        origin: ORIGIN
      }
    }
  });
}

