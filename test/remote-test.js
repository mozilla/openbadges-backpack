var vows = require('./setup')
  , assert = require('assert')
  , issuer = require('./fake-issuer')
  , remote = require('../remote')
  , database = require('../database')
  , configuration = require('../lib/configuration')
  , color = require('colors')

vows.describe('Issuing by remote assertion').addBatch({
  'Submitting a': {
    'good assertion': {
      topic: issuer.goodAssertion(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == success`': function(err, result){ assert.equal(err.status, 'success'); },
        'a proper assertion object': function(err, result){ assert.equal(result.recipient, 'bimmy@example.com'); }
      },
      teardown: function(server){ server.close(); }
    },
    'bad assertion': {
      topic: issuer.badAssertion(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == validation`': function(err, result){ assert.equal(err.error, 'validation') }
      },
      teardown: function(server){ server.close(); }
    },
    'really bad assertion (bad json)': {
      topic: issuer.reallyBadAssertion(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == unaccepted`': function(err, result){ assert.equal(err.error, 'unaccepted') }
      },
      teardown: function(server){ server.close(); }
    },
    'dreadful assertion (4xx or 5xx)': {
      topic: issuer.dreadfulAssertion(),
      'should get': {
        topic: function(server) { remote.assertion(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(err.status, 'failure') },
        '`error == unreachable`': function(err, result){ assert.equal(err.error, 'unreachable') }
      },
      teardown: function(server){ server.close(); }
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
