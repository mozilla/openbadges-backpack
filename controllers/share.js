var _ = require('underscore');
var url = require('url');
var User = require('../models/user');
var Badge = require('../models/badge');
var Portfolio = require('../models/portfolio');
var Group = require('../models/group');
var reverse = require('../lib/router').reverse;
var configuration = require('../lib/configuration');
var logger = require('../lib/logging').logger;

exports.param = {
  groupUrl: function (request, response, next, url) {
    Group.findOne({url: url}, function (err, group) {
      if (err) {
        logger.error("Error pulling group: " + err);
        return response.send('Error pulling group', 500);
      }
      if (!group) {
        return response.send('Could not find group', 404);
      }
      Portfolio.findOne({group_id: group.get('id')}, function (err, portfolio) {
        if (err) return next(err);
        if (portfolio) group.set('portfolio', portfolio);
        request.group = group;
        return next();
      });
    });
  }
};


function badgeModifierFactory(portfolio, badgeById) {
  return function modbadges(badge) {
    var id = badge.get('id');
    var story = portfolio.get('stories')[id];
    var body = badge.get('body');
    var origin = body.badge.issuer.origin;
    var criteria = body.badge.criteria;
    var evidence = body.evidence;

    if (criteria[0] === '/') body.badge.criteria = origin + criteria;
    if (evidence && evidence[0] === '/') body.evidence = origin + evidence;

    badge.set('_userStory', story);
    return badge;
  };
}

exports.editor = function (request, response) {
  var user = request.user;
  var group = request.group;

  if (!user)
    return response.send('nope', 403);

  if (user.get('id') !== group.get('user_id'))
    return response.send('nope', 403);

  var portfolio = group.get('portfolio');
  if (!portfolio)
    portfolio = new Portfolio({
      group_id: group.get('id'),
      title: group.get('name'),
      stories: {}
    });

  request.group.getBadgeObjects(function (err, badges) {
    var badgesWithStories = _.map(badges, badgeModifierFactory(portfolio));
    portfolio.group = group;
    portfolio.badges = badgesWithStories;
    portfolio.preamble = prepareText(portfolio.get('preamble'));
    response.render('portfolio-editor', {
      csrfToken: request.session._csrf,
      portfolio: portfolio
    });
  });
};

// #TODO: un-stupid this.
function prepareText(txt) {
  txt = txt || '';
  var better = txt
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p>');
  return better;
}

function makeLinkUrl(path, configuration) {
  var protocol = configuration.get('protocol');
  var host = configuration.get('hostname');
  var port = configuration.get('port');
  return url.format({protocol: protocol, hostname: host, port: port, pathname: path });
}

exports.show = function (request, response, next) {
  var user, group, portfolio, owner, message, socialcode;

  user = request.user;
  group = request.group;
  portfolio = group.get('portfolio');
  owner = user && group.get('user_id') === user.get('id');

  // If there is no portfolio and this is the owner, create and save a new
  // portfolio object. Otherwise, kick the user out.
  if (!portfolio) {
    if (!owner) return response.send('no portfolio :(', 404);
    portfolio = new Portfolio({
      group_id: group.get('id'),
      title: group.get('name'),
      stories: {}
    });
    portfolio.save();
  }

  // if this is the user's page, show SocialShare button
  if (owner) {
    message = '<p class="shareMessage">This is what your portfolio page looks like to the public.</p>';
    socialcode = '<div class="socialshare" style="float: left;" tabindex="0" onclick="injectSocialMedia(this)">'
      + '<span class="msg">Share this on twitter, google+ or facebook</span>'
      + '<div class="social-medium twitter"></div>'
      + '<div class="social-medium google"></div>'
      + '<div class="social-medium facebook"></div>';
  }

  request.group.getBadgeObjects(function (err, badges) {
    var badgesWithStories = _.map(badges, badgeModifierFactory(portfolio));
    portfolio.badges = badgesWithStories;
    portfolio.preamble = prepareText(portfolio.get('preamble'));

    return response.render('portfolio', {
      opengraph: [
        { property: 'title', content: portfolio.attributes.title },
        { property: 'type', content: 'openbadges:share' },
        { property: 'url', content: makeLinkUrl(request.url, configuration) }
      ],
      portfolio: portfolio,
      message: message || null,
      socialcode: socialcode || null,
      owner: owner
    });
  });
};

exports.createOrUpdate = function (request, response) {
  var group = request.group;
  var user = request.user;

  if (!user)
    return response.send('Forbidden', 403);

  if (group.get('user_id') !== user.get('id'))
    return response.send('Forbidden', 403);

  var stories = {};
  var submitted = request.body;

  for (var i = 0; i < submitted.stories.length; i++)
    if (submitted.stories[i]) stories[i] = submitted.stories[i];

  var portfolio = new Portfolio({
    stories: stories,
    group_id: group.get('id'),
    title: submitted.title,
    subtitle: submitted.subtitle,
    preamble: submitted.preamble
  });

  portfolio.save(function (err, p) {
    return response.redirect(request.url, '303');
  });
};
