var _ = require('underscore');
var Group = require('../models/group.js');
var Portfolio = require('../models/portfolio.js');
var Badge = require('../models/badge.js');
var logger = require('../lib/logging').logger;

exports.param = {
  groupId: function(req, res, next, id) {
    Group.findById(id, function(err, group) {
      if (err) {
        logger.error("Error pulling group: " + err);
        return res.send('Error pulling group', 500);
      }
      
      if (!group) {
        return res.send('Could not find group', 404);
      }
      
      req.group = group;
      return next();
    });
  }
}

exports.create = function (req, res) {
  if (!req.user) return res.json({error:'no user'}, 403);
  if (!req.body) return res.json({error:'no badge body'}, 400);
  if (!req.body.badges) return res.json({error:'no badges'}, 400);
  function makeNewBadge(attributes) { return new Badge(attributes); }
  var user = req.user;
  var body = req.body;
  var badges = body.badges;
  var group = new Group({
    user_id: user.get('id'),
    name: body.name,
    badges: badges.map(makeNewBadge)
  }); 

  group.save(function (err, group) {
    if (err) {
      logger.debug('there was some sort of error creating a group:');
      logger.debug(err);
      return res.send('there was an error', 500)
    }
    res.contentType('json');
    res.send({id: group.get('id'), url: group.get('url')});
  })
};

exports.update = function (req, res) {
  if (!req.user)
    return res.send({
      status: 'forbidden',
      error: 'user required'
    }, 403);
  
  if (!req.group)
    return res.send({
      status: 'missing-required',
      error: 'missing group to update'
    }, 400);
  
  if (req.user.get('id') !== req.group.get('user_id'))
    return res.send({
      status: 'forbidden',
      error: 'you cannot modify a group you do not own'
    }, 403);
  
  if (!req.body)
    return res.send({
      status: 'missing-required',
      error: 'missing fields to update'
    }, 400)
  
  var group = req.group;
  var body = req.body;
  
  if (body.name) {
    var saferName = body.name.replace('<', '&lt;').replace('>', '&gt;');
    group.set('name', saferName);
  }
  
  if (body['public']) {
    group.set('public', !!body['public']);
  }
  
  if (body.badges) {
    function makeBadgeObj(attr) { return new Badge(attr) }
    group.set('badges', body.badges.map(makeBadgeObj));
  }
  
  group.save(function (err) {
    if (err) {
      logger.debug('there was an error updating a group:');
      logger.debug(err);
      return res.send({
        status: 'error',
        error: 'there was an unknown error. it has been logged.'
      }, 500);
    }
    
    res.contentType('json');
    res.send({status: 'okay'});
  })
};

exports.destroy = function (request, response) {
  var user = request.user;
  var group = request.group;
  
  if (!user)
    return response.send('no logged in user', 403);
  
  if (!group)
    return response.send('group not found', 404);
  
  if (group.get('user_id') !== user.get('id'))
    return response.send('group not yours', 403);
  
  // find any profile associated with this group and delete it
  Portfolio.findOne({group_id: group.get('id')}, function (err, folio) {
    if (err) {
      logger.debug('error finding portfolios:');
      logger.debug(err);
      return response.send('nope', 500);
    }
    
    if (folio) folio.destroy();
    
    group.destroy(function (err) {
      if (err) {
        logger.debug('error deleting group');
        logger.debug(err);
        return response.send('nope', 500);
      }
      response.contentType('json');
      response.send(JSON.stringify({success: true}));
    })
  })
};