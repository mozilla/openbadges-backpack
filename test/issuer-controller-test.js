var vows = require('vows')
  , assert = require('assert')
  , should = require('should')
  , issuer = require('../controllers/issuer.js')
  , conmock = require('./conmock.js')
  , _ = require('underscore')

vows.describe('issuer controller test').addBatch({
  'Issuer Controller': {
    '#validator': {
      
      'when client sends no data' : {
        'and header "Accept: */*"' : {
          topic: function () {
            var req = { headers: {accept: '*/*'} };
            conmock(issuer.validator, req, this.callback);
          },
          'renders validator html without options' : function (err, mock) {
            mock.fntype.should.equal('render');
            mock.path.should.equal('validator');
          },
        },
        'and "Accept: text/html"' : {
          topic: function () {
            var req = { headers: {accept: 'text/html'} };
            conmock(issuer.validator, req, this.callback);
          },
          'renders validator html without options' : function (err, mock) {
            mock.fntype.should.equal('render');
            mock.path.should.equal('validator');
          },
        },
        'and "Accept: text/plain"' : {
          topic: function () {
            var req = { headers: {accept: 'text/plain'} };
            conmock(issuer.validator, req, this.callback);
          },
          'sends back plain text' : function (err, mock) {
            mock.headers['Content-Type'].should.equal('text/plain');
          },
          'status 400' : function (err, mock) {
            mock.status.should.equal(400);
          },
          'body has word "data" in it' : function (err, mock) {
            mock.body.should.match(/data/);
          },
        },
        'and "Accept: application/json"' : {
          topic: function () {
            var req = { headers: {accept: 'application/json'} };
            conmock(issuer.validator, req, this.callback);
          },
          'sends back json' : function (err, mock) {
            mock.headers['Content-Type'].should.equal('application/json');
          },
          'status 400' : function (err, mock) {
            mock.status.should.equal(400);
          },
          'message has word "error" in it' : function (err, mock) {
            mock.body.status.should.match(/error/);
          },
        },
      },
      
      
      'when client sends an empty data set' : {
        topic: function () { return function () { return { body: { data : '{}' }, headers: {} } } },
        'and header "Accept: */*"' : {
          topic: function (req) {
            req = req();
            req.headers.accept = '*/*';
            conmock(issuer.validator, req, this.callback);
          },
          'renders validator html with some options' : function (err, mock) {
            mock.fntype.should.equal('render');
            mock.path.should.equal('validator');
            var errors = _.pluck(mock.options.errors, 'field');
            assert.include(errors, 'recipient');
            assert.include(errors, 'badge.version');
            assert.include(errors, 'badge.name');
            assert.include(errors, 'badge.image');
            assert.include(errors, 'badge.description');
            assert.include(errors, 'badge.criteria');
            assert.include(errors, 'badge.issuer.origin');
            assert.include(errors, 'badge.issuer.name');
          },
        },
        'and "Accept: application/json"' : {
          topic: function (req) {
            req = req();
            req.headers.accept = 'application/json';
            conmock(issuer.validator, req, this.callback);
          },
          'sends back json with a bunch of errors' : function (err, mock) {
            mock.status.should.equal(400);
            var errors = _.pluck(mock.body.errors, 'field');
            assert.include(errors, 'recipient');
            assert.include(errors, 'badge.version');
            assert.include(errors, 'badge.name');
            assert.include(errors, 'badge.image');
            assert.include(errors, 'badge.description');
            assert.include(errors, 'badge.criteria');
            assert.include(errors, 'badge.issuer.origin');
            assert.include(errors, 'badge.issuer.name');
          },
        },
        'and "Accept: text/plain"' : {
          topic: function (req) {
            req = req();
            req.headers.accept = 'text/plain';
            conmock(issuer.validator, req, this.callback);
          },
          'sends back text with a bunch of errors' : function (err, mock) {
            mock.body.split('\n').length.should.equal(8);
          },
        },
      },
    },
  },
}).export(module)