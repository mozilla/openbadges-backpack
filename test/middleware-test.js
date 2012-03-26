var vows = require('vows');
var assert = require('assert');
var should = require('should');
var middleware = require('../middleware.js');
var conmock = require('./conmock.js');

vows.describe('middlware tests').addBatch({
  '#cors': {
    'no whitelist' : {
      'topic' : function () {
        var hdlr = middleware.cors();
        conmock(hdlr, {}, this.callback);
      },
      'does not add header' : function (err, mock) {
        should.not.exist(mock.headers['Access-Control-Allow-Origin'], 'CORS header present when it should not be.');
      },
    },
    'whitelist is a string, url not on it' : {
      'topic' : function () {
        var hdlr = middleware.cors({ whitelist: '/foo' });
        conmock(hdlr, { url: '/bar' }, this.callback);
      },
      'does not add header' : function (err, mock) {
        should.not.exist(mock.headers['Access-Control-Allow-Origin'], 'CORS header present when it should not be.');
      },
    },
    'whitelist is a string, url matches' : {
      'topic' : function () {
        var hdlr = middleware.cors({ whitelist: '/foo' });
        conmock(hdlr, { url: '/foo' }, this.callback);
      },
      'should add CORS header' : function (err, mock) {
        should.exist(mock.headers['Access-Control-Allow-Origin'], 'CORS header not present when it should be.');
      },
    },
    'whitelist is a list, url matches' : {
      'topic' : function () {
        var hdlr = middleware.cors({ whitelist: ['/bar', '/f..'] });
        conmock(hdlr, { url: '/foo' }, this.callback);
      },
      'should add CORS header' : function (err, mock) {
        should.exist(mock.headers['Access-Control-Allow-Origin'], 'CORS header not present when it should be.');
      },
    },
    'whitelist is a list, url does not match' : {
      'topic' : function () {
        var hdlr = middleware.cors({ whitelist: ['/bar', '/f..'] });
        conmock(hdlr, { url: '/rad' }, this.callback);
      },
      'should add CORS header' : function (err, mock) {
        should.not.exist(mock.headers['Access-Control-Allow-Origin'], 'CORS header present when it should not be.');
      },
    },
  },
}).export(module);