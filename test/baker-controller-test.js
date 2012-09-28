var fs = require('fs');
var nock = require('nock');
var vows = require('vows');
var assert = require('assert');
var should = require('should');
var request = require('request');
var mysql = require('../lib/mysql');
var conmock = require('./conmock.js');
var fixture = require('../lib/utils.js').fixture;
var controller = require('../controllers/baker.js');

var imagedata = fs.readFileSync(__dirname + '/utils/images/no-badge-data.png')
var scope = nock('http://example.com')
  .intercept('/missing.json', 'HEAD').reply(404, '')
  .get('/missing.json').reply(404, '')
  
  .intercept('/invalid.json', 'HEAD').reply(200, '')
  .get('/invalid.json').reply(200, 'eeeeyyyyy', { 'Content-Type': 'application/json' })

  .intercept('/invalid-content-type.json', 'HEAD').reply(200, '')
  .get('/invalid-content-type.json').reply(200, fixture())
  
  .intercept('/missing-image.json', 'HEAD').reply(200, '')
  .get('/missing-image.json')
  .reply(200, fixture({'badge.image': 'http://example.com/image-not-found.png'}), { 'Content-Type': 'application/json' })

  .intercept('/image-not-found.png', 'HEAD').reply(404, '')
  .get('/image-not-found.png').reply(404, '')

  .intercept('/legit.json', 'HEAD').reply(200, '')
  .get('/legit.json')
  .reply(200, fixture({
    'badge.image': 'http://example.com/image.png',
    'recipient': 'brian@example.com'
  }), { 'Content-Type': 'application/json' })

  .intercept('/image.png', 'HEAD').reply(200, '', { 'Content-Type': 'image/png' })
  .get('/image.png').reply(200, imagedata, { 'Content-Type': 'image/png' })

  .intercept('/legit-award.json', 'HEAD').reply(200, '')
  .get('/legit-award.json')
  .reply(200, fixture({
    'badge.image': 'http://example.com/image-award.png',
    'recipient': 'brian@example.com'
  }), { 'Content-Type': 'application/json' })

  .intercept('/image-award.png', 'HEAD').reply(200, '', { 'Content-Type': 'image/png' })
  .get('/image-award.png').reply(200, imagedata, { 'Content-Type': 'image/png' })

  .intercept('/invalidAssertion', 'HEAD').reply(200, '')
  .get('/invalidAssertion')
  .reply(200, fixture({
    'badge.image': 'http://example.com/image.png',
    // invalid content for email
    'recipient': 'example.com'
  }), { 'Content-Type': 'application/json' })
;

vows.describe('baker controller testing').addBatch({  
  '#baker called with a' : {
    topic: function() {
      mysql.prepareTesting(this.callback);
    },
    'complete': function() {
    },
    'missing assertion url': {
      topic : function () {
        conmock(controller.baker, {}, this.callback);
      },
      'renders the creator' : function (error, mock) {
        mock.fntype.should.equal('render');
        mock.path.should.equal('baker');
      }
    },
    'bogus assertion url': {
      topic : function () {
        var req = { query: { assertion: 'wuuuuut' } };
        conmock(controller.baker, req, this.callback);
      },
      'returns 400, unreachable' : function (error, mock) {
        mock.headers.should.have.property('Content-Type', 'application/json');
        mock.body.should.match(/unreachable/i);
      }
    },
    'correct, but missing assertion url': {
      topic : function () {
        var req = { query: { assertion: 'http://example.com/missing.json' } };
        conmock(controller.baker, req, this.callback);
      },
      'returns 400, unreachable assertion' : function (error, mock) {
        mock.body.should.match(/unreachable/i);
        mock.body.should.match(/assertion/i);
      }
    },
    'valid url, but the endpoint is not the right content type': {
      topic : function () {
        var req = { query: { assertion: 'http://example.com/invalid-content-type.json' } };
        conmock(controller.baker, req, this.callback);
      },
      'returns 400, content type error' : function (error, mock) {
        mock.status.should.equal(400);
        mock.body.should.match(/ContentType/);
      }
    },
    'valid url, valid content-type, but the content is unparseable ': {
      topic : function () {
        var req = { query: { assertion: 'http://example.com/invalid.json' } };
        conmock(controller.baker, req, this.callback);
      },
      'returns 400, parse error' : function (error, mock) {
        mock.status.should.equal(400);
        mock.body.should.match(/ParseError/);
      }
    },
    'valid assertion, but the image url 404s ': {
      topic : function () {
        var req = { query: { assertion: 'http://example.com/missing-image.json' } };
        conmock(controller.baker, req, this.callback);
      },
      'returns 400, unreachable image' : function (error, mock) {
        mock.status.should.equal(400);
        mock.body.match(/unreachable/);
        mock.body.match(/image/);
      }
    },
    'valid assertion, valid image url ': {
      topic : function () {
        var req = { query: { assertion: 'http://example.com/legit.json' } };
        conmock(controller.baker, req, this.callback);
      },
      'returns 200, baked image data' : function (error, mock) {
        mock.headers.should.have.property('Content-Type', 'image/png');
        mock.status.should.equal(200);
      }
    },
    'valid assertion, valid image url, trying to award': {
      topic : function () {
        var req = { query: { assertion: 'http://example.com/legit-award.json', award: 'brian@example.com' } };
        conmock(controller.baker, req, this.callback);
      },
      'returns 200, baked image data' : function (error, mock) {
        mock.headers.should.have.property('Content-Type', 'image/png');
        mock.headers.should.have.property('x-badge-awarded', 'brian@example.com');
        mock.status.should.equal(200);
      }
    },
    'Valid assertion url, but invalid assertion content':{
      topic: function(){
        var req = { query: { assertion: 'http://example.com/invalidAssertion'}};
        conmock(controller.baker, req, this.callback);
      },
      'returns 400, Invalid Assertion': function(error, mock){
        mock.status.should.equal(400);
        mock.body.should.match(/invalid/);
      }
    }
  }
}).export(module);
