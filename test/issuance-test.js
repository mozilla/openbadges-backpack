var vows = require('./setup').vows
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
        topic: function(server) { remote.process(server.url, this.callback, function(){return '42'}) },
        '`status == success`': function(err, result){ assert.equal(result.status, 'success'); },
        '`id == <something>`': function(err, result){ assert.equal(result.id, 42); }
      },
      'but bad local reaction': {
        topic: function(server) {
          remote.process(server.url, this.callback, function(){
            throw new Error('u mad?');
          })
        },
        'should get `status == failure`': function(err, result){ assert.equal(result.status, 'failure'); },
        'should get `error == database`': function(err, result){ assert.equal(result.error, 'unknown'); }
      },
      teardown: function(server){ server.close(); }
    },
    'bad assertion': {
      topic: issuer.badAssertion(),
      'should get': {
        topic: function(server) { remote.process(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(result.status, 'failure') },
        '`error == validation`': function(err, result){ assert.equal(result.error, 'validation') }
      },
      teardown: function(server){ server.close(); }
    },
    'really bad assertion (bad json)': {
      topic: issuer.reallyBadAssertion(),
      'should get': {
        topic: function(server) { remote.process(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(result.status, 'failure') },
        '`error == unaccepted`': function(err, result){ assert.equal(result.error, 'unaccepted') }
      },
      teardown: function(server){ server.close(); }
    },
    'dreadful assertion (4xx or 5xx)': {
      topic: issuer.dreadfulAssertion(),
      'should get': {
        topic: function(server) { remote.process(server.url, this.callback) },
        '`status == failure`': function(err, result){ assert.equal(result.status, 'failure') },
        '`error == unreachable`': function(err, result){ assert.equal(result.error, 'unreachable') }
      },
      teardown: function(server){ server.close(); }
    },
    'bogus assertion (dns error)': {
      'should get': {
        topic: function(server) { remote.process('http://this-is-not-even-a-server', this.callback) },
        '`status == failure`': function(err, result){ assert.equal(result.status, 'failure') },
        '`error == unreachable`': function(err, result){ assert.equal(result.error, 'unreachable') }
      }
    },
    'wildly bogus assertion (dns error)': {
      'should get': {
        topic: function(server) { remote.process('klasjdf;lajs;dho', this.callback) },
        '`status == failure`': function(err, result){ assert.equal(result.status, 'failure') },
        '`error == unreachable`': function(err, result){ assert.equal(result.error, 'unreachable') }
      }
    }
  }
}).export(module);
