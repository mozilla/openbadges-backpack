// modules
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bakery = require('openbadges-bakery');
const async = require('async');
const xtend = require('xtend')

// local requirements
const regex = require('../lib/regex');
const logger = require('../lib/logger');
const awardBadge = require('../lib/award');
const Badge = require('../models/badge');
const analyzeAssertion = require('../lib/analyze-assertion');

function quickmd5(data) {
  var md5sum = crypto.createHash('md5');
  return md5sum.update(data).digest('hex');
}

function preferredImage(resources) {
  return resources['assertion.image'] || resources['badge.image'];
}

exports.baker = function (req, res) {
  const query = req.query||{};
  const url = query.assertion;

  // render the badge baker frontend and bounce if no assertion was passed
  if (!url)
    return res.render('baker.html', {
      title: 'Creator',
      login: false
    });

  res.setHeader('Content-Type', 'application/json');

  if (!regex.absoluteUrl.exec(url))
    return res.json(400, {message: 'must provide a valid assertion url'})

  const awardOptions = {};
  async.waterfall([
    function getRemoteAssertion(callback) {
      awardOptions.url = url;
      analyzeAssertion(url, callback)
    },
    function bakeBadge(data, callback) {
      var image = preferredImage(data.info.resources)
      var assertion = data.info.structures.assertion;
      awardOptions.assertion = data.info.structures.assertion;

      if (!assertion.verify) {
        assertion = xtend(assertion, {
          verify:{ type: 'hosted', url: url }
        })
      }

      bakery.bake({
        image: image,
        assertion: assertion
      }, callback)

    },
    function maybeAward(imageData, callback) {
      const shouldAward = query.award && query.award !== 'false';
      awardOptions.recipient = query.award;
      awardOptions.imagedata = imageData;
      if (shouldAward)
        return awardBadge(awardOptions, callback)
      return callback(null, null);
    },
    function probablyDone(badge, callback) {
      const imageData = awardOptions.imagedata;
      const extension = {
        'image/png': '.png',
        'image/svg+xml': '.svg',
      }

      bakery.typeCheck(imageData, function (err, type) {
        const filename = quickmd5(imageData) + extension[type];

        res.setHeader('Content-Type', type);
        res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

        if (badge) {
          logger.warn('badge awarded through baker: %s', url);
          res.setHeader('x-badge-awarded', query.award);
        }

        res.send(imageData);
        return callback();
      })

    }
  ], function handleErrors(err) {
    if (err)
      return res.json(400, err);
  });
};
