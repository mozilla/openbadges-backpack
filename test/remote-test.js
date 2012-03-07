var vows = require('vows')
  , assert = require('assert')
  , remote = require('../lib/remote')
  , genstring = require('../lib/utils').genstring
  , configuration = require('../lib/configuration');

var TOO_BIG = remote.MAX_RESPONSE_SIZE + 1;

var mockResponse = function (status, length, type) {
  var resp = {}
  resp.statusCode = status || 200;
  resp.headers = {}
  resp.headers['content-length'] = length || 0;
  resp.headers['content-type'] = type || 'text/html';
  return resp;
}; 
  
vows.describe('Handling remote servers').addBatch({
  'remote.assert.reachable': {
    'throws error on status > 400': function () {
      var resp = mockResponse(500);
      assert.throws(function () {
        remote.assert.reachable(null, resp);
      }, remote.UnreachableError)
    },
    'does not throw error when reachable': function () {
      var resp = mockResponse(200);
      assert.doesNotThrow(function () {
        remote.assert.reachable(null, resp);
      })
      
      resp = mockResponse(304);
      assert.doesNotThrow(function () {
        remote.assert.reachable(null, resp);
      })
      
      resp = mockResponse(301);
      assert.doesNotThrow(function () {
        remote.assert.reachable(null, resp);
      })
    }
  },
  'remote.assert.size': {
    'throws error when response header is too big': function () {
      var resp = mockResponse(200, TOO_BIG);
      assert.throws(function () {
        remote.assert.size(resp);
      }, remote.SizeError);
    },
    'throws error when body is too big': function () {
      var resp = mockResponse(200);
      assert.throws(function () {
        remote.assert.size(resp, genstring(TOO_BIG));
      }, remote.SizeError);
    },
    'does not throw error when both are fine': function () {
      var resp = mockResponse(200);
      assert.doesNotThrow(function () {
        remote.assert.size(resp, genstring(TOO_BIG - 2));
      });
    }
  },
  'remote.assert.contentType': {
    'throws error when given an expected content type': function () {
      var resp = mockResponse(200, 0, 'application/json');
      assert.throws(function () {
        remote.assert.contentType(resp, 'text/html');
      }, remote.ContentTypeError);
    },
    'does not throw error when given an expected content type': function () {
      var resp = mockResponse(200, 0, 'application/json');
      assert.doesNotThrow(function () {
        remote.assert.contentType(resp, 'application/json');
      }, remote.ContentTypeError);
    }
  },
}).export(module);
