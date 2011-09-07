var vows = require('./setup')
  , assert = require('assert')
  , issuer = require('./issuer')
  , remote = require('../remote')
  , database = require('../database')
  , configuration = require('../lib/configuration')
  , color = require('colors')

vows.describe('Handling remote servers').addBatch({
  'Submitting a': {
    'good assertion': {
      topic: issuer.simple.good(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == success`': function(err, result){ assert.equal(err.status, 'success'); },
        'a proper assertion object': function(err, result){ assert.equal(result.recipient, 'bimmy@example.com'); }
      },
    },
    'assertion with invalid type': {
      topic: issuer.simple.invalidType(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == content-type`': function(err, result){ assert.equal(err.error, 'content-type') }
      },
    },
    'bad assertion': {
      topic: issuer.simple.bad(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == validation`': function(err, result){ assert.equal(err.error, 'validation') }
      },
    },
    'really bad assertion (bad json)': {
      topic: issuer.simple.reallyBad(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == parse`': function(err, result){ assert.equal(err.error, 'parse') }
      },
    },
    'dreadful assertion (4xx or 5xx)': {
      topic: issuer.simple.dreadful(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == unreachable`': function(err, result){ assert.equal(err.error, 'unreachable') }
      },
    },
    'bogus assertion (dns error)': {
      'should get': {
        topic: function(server) { remote.assertion('http://this-is-not-even-a-server', this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == unreachable`': function(err, result){ assert.equal(err.error, 'unreachable') }
      }
    },
    'wildly bogus assertion (dns error)': {
      'should get': {
        topic: function(server) { remote.assertion('klasjdf;lajs;dho', this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == unreachable`': function(err, result){ assert.equal(err.error, 'unreachable') }
      }
    }
  }
}).export(module);
