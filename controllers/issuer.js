var fs = require('fs');

var myFiles = [
  "issuer-parts/issuer-script-intro.js"
, "jquery.min.js"
, "jschannel.js"
, "issuer-parts/issuer-core.js"
, "issuer-parts/issuer-script-outro.js"
];

myFiles = myFiles.map(function(filename) {
  return __dirname + '/../static/js/' + filename;
});

exports.generateScript = function(req, res) {
  concatenate(myFiles, function(err, data) {
    if (err) {
      res.send(500);
      throw err;
    } else {
      res.header('Content-Type', 'application/javascript');
      res.send(data);
    }
  });
};

exports.frame = function(req, res) {
  res.render('issuer-frame', {
    layout: null,
    foo: 'bar'
  });
};

function concatenate(files, cb) {
  var completed = 0;
  var contents = [];
  
  function startLoading(i) {
    fs.readFile(files[i], function(err, data) {
      if (err) {
        cb(err);
        return;
      }
      contents[i] = data;
      completed++;
      if (completed == files.length)
        cb(null, contents.join('\n'));
    });
  }

  for (var i = 0; i < files.length; i++)
    startLoading(i);
};

if (module.parent === null) {
  concatenate(myFiles, function(err, data) {
    var filename = 'issuer.js';
    if (err)
      throw err;
    fs.writeFileSync(filename, data);
    console.log('wrote', filename, '(' + data.length, 'bytes)');
  });
}

var request = require('request')
  , logger = require('../lib/logging').logger
  , reverse = require('../lib/router').reverse
  , awardBadge = require('../lib/award')
  , remote = require('../lib/remote')
  , check = require('validator').check


exports.issuerBadgeAddFromAssertion = function(req, res, next) {
  // handles the adding of a badge via assertion url called
  // from issuerBadgeAdd
  // called as an ajax call.
  var user = req.user
    , error = req.flash('error')
    , success = req.flash('success');

  if (!user) return res.redirect(reverse('backpack.login'), 403);

  // get the url param
  var assertionUrl = req.param('url'); // GET
  if (!assertionUrl) {
    var assertionUrl = req.body['url'];
  }

  // check if the assertion url is malformed
  try {
    check(assertionUrl).isUrl();
  } 
  catch (e) {                      
    return res.rend('error', { status: 400,
                               message: 'malformed url'});
  }

  // everything wins!
  return res.render('error', { status:200, message: 'success i guess'});


  remote.getHostedAssertion(assertionUrl, function(err, assertion) {
    if (err) {
      logger.error("assertion error "+err);
      /*todo: figure out returning an ajax error*/
    }
    if (assertion.recipient !== user.get('email')) {
      /*todo another error*/
    }
    remote.badgeImage(assertion.badge.image, function(err, imagedata) {
      awardBadge(assertion, assertionUrl, imagedata, function(err, badge) {
        if (err) {
          /* todo again, another error */
          logger.error("badge error " + assertionUrl);
        }
        else { logger.debug("badge added " + assertionUrl); }
      })
    })
    logger.debug(assertion);
    return(assertion);
  })
  logger.debug(req.body['assertion']);
};
