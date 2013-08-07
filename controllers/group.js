var _ = require('underscore');
var Group = require('../models/group.js');
var Portfolio = require('../models/portfolio.js');
var Badge = require('../models/badge.js');
const logger = require('../lib/logger');

function makeBadgeObj(attr) { return new Badge(attr) }

exports.findById = function findById(req, res, next, id) {
  Group.findById(id, function (err, group) {
    if (err) {
      logger.error("Error pulling group: " + err);
      return res.send(500, {
        status: 'error',
        error: 'Error pulling group'
      });
    }

    if (!group)
      return res.send(404, {
        status: 'missing',
        error: 'Could not find group'
      });

    req.group = group;
    return next();
  });
};

exports.create = function (request, response) {
  if (!request.user)
    return response.json(403, {error: 'no user'});

  if (!request.body)
    return response.json(400, {error: 'no badge body'});

  if (!request.body.badges)
    return response.json(400, {error: 'no badges'});

  var user = request.user;
  var body = request.body;
  var badges = body.badges;
  var group = new Group({
    user_id: user.get('id'),
    name: body.name,
    badges: badges.map(makeBadgeObj)
  });

  group.save(function (err, group) {
    if (err) {
      logger.debug(err, 'there was some sort of error creating a group');
      return response.send(500, 'there was an error');
    }
    response.contentType('json');
    response.send({id: group.get('id'), url: group.get('url')});
  });
};

exports.update = function (request, response) {
  if (!request.user)
    return response.send(403, {
      status: 'forbidden',
      error: 'user required'
    });

  if (!request.group)
    return response.send(404, {
      status: 'missing-required',
      error: 'missing group to update'
    });

  if (request.user.get('id') !== request.group.get('user_id'))
    return response.send(403, {
      status: 'forbidden',
      error: 'you cannot modify a group you do not own'
    });

  if (!request.body)
    return response.send(400, {
      status: 'missing-required',
      error: 'missing fields to update'
    });

  var group = request.group;
  var body = request.body;

  if (body.name) {
    var saferName = body.name.replace('<', '&lt;').replace('>', '&gt;');
    group.set('name', saferName);
  }

  if (body['public'] === true) {
    group.set('public', true);
  } else {
    group.set('public', false);
  }

  if (body.badges) {
    group.set('badges', body.badges.map(makeBadgeObj));
  }

  group.save(function (err) {
    if (err) {
      logger.debug(err, 'there was an error updating a group');
      return response.send(500, {
        status: 'error',
        error: 'there was an unknown error. it has been logged.'
      });
    }

    response.contentType('json');
    response.send({status: 'okay'});
  });
};

exports.destroy = function (request, response) {
  var user = request.user;
  var group = request.group;

  if (!user)
    return response.send(403, {
      status: 'forbidden',
      error: 'user required'
    });

  if (!group)
    return response.send(404, {
      status: 'missing-required',
      error: 'missing group to update'
    });

  if (group.get('user_id') !== user.get('id'))
    return response.send(403, {
      status: 'forbidden',
      error: 'you cannot modify a group you do not own'
    });

  // find any profile associated with this group and delete it
  Portfolio.findOne({group_id: group.get('id')}, function (err, folio) {
    if (err) {
      logger.debug(err, 'error finding portfolios');
      return response.send(500, {
        status: 'error',
        error: 'there was some sort of error and it has been logged'
      });
    }

    if (folio) folio.destroy();

    group.destroy(function (err) {
      if (err) {
        logger.debug(err, 'error deleting group');
        return response.send(500, {
          status: 'error',
          error: 'there was some sort of error and it has been logged'
        });
      }
      response.send({status: 'okay'});
    });
  });
};