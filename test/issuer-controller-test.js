var vows = require('vows')
  , assert = require('assert')
  , should = require('should')
  , issuer = require('../controllers/issuer.js')
  , conmock = require('./conmock.js')

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
          'message has word "data" in it' : function (err, mock) {
            mock.body.message.should.match(/data/);
          },
        },
      },
    },
  },
}).export(module)