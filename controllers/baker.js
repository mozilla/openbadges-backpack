// modules
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bakery = require('openbadges-bakery');
const async = require('async');

// local requirements
const logger = require('../lib/logging').logger;
const awardBadge = require('../lib/award');
const Badge = require('../models/badge');
const analyzeAssertion = require('../lib/analyze-assertion');

function quickmd5(data) {
  var md5sum = crypto.createHash('md5');
  return md5sum.update(data).digest('hex');
}

exports.baker = function (req, res) {
  function preferedImage(resources) {
    return resources['assertion.image'] || resources['badge.image'];
  }

  const query = req.query||{};
  const url = query.assertion;

  // render the badge baker frontend and bounce if no assertion was passed
  if (!url)
    return res.render('baker.html', {
      title: 'Creator',
      login: false
    });

  res.setHeader('Content-Type', 'application/json');

  if (!/^http/.exec(url))
    return res.json(400, {message: 'must provide a valid assertion url'})

  const awardOptions = {};
  async.waterfall([
    function getRemoteAssertion(callback) {
      awardOptions.url = url;
      analyzeAssertion(url, callback)
    },
    function bakeBadge(info, callback) {
      const image = preferedImage(info.resources);
      awardOptions.assertion = info.structures.assertion;
      bakery.bake({
        image: image,
        data: url
      }, callback)
    },
    function maybeAward(imageData, callback) {
      const shouldAward = query.award && query.award !== 'false';
      const filename = quickmd5(imageData) + '.png';
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
      if (!shouldAward) {
        res.send(imageData);
        return callback(null, null);
      }
      awardOptions.recipient = query.award;
      awardOptions.imagedata = imageData;
      awardBadge(awardOptions, callback)
    },
    function probablyDone(badge, callback) {
      if (!badge) return callback();
      logger.warn('badge awarded through baker:', url);
      res.setHeader('x-badge-awarded', query.award);
      return callback();
    }
  ], function handleErrors(err) {
    if (err)
      return res.json(400, err);
  });
};
