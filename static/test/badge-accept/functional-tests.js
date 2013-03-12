var FAKE_XHR_DELAY = 10;
var ASSERTION_URLS = [
  "http://foo.org/newbadge.json",
  "http://foo.org/another_newbadge.json",
  "http://foo.org/nonexistent.json",
  "http://bar.org/oldbadge.json",
  "http://foo.org/notowner.json",
  "http://foo.org/explodeonissue.json"
  // TODO: additional cases - duplicate on issue, explode on build
];
var RESPONSES = {
  "http://foo.org/notowner.json": {
    owner: false,
    exists: false,
    badge: {
      "recipient": "someone_else@example.com",
      "evidence": "/badges/html9-basic/example",
      "badge": {
        "version": "0.5.0",
        "name": "HTML9 Fundamental",
        "image": "/_demo/nc.large.png",
        "description": "Fetchable and validates fine client-side but not server-side",
        "criteria": "/badges/html9-basic",
        "issuer": {
          "origin": "http://p2pu.org",
          "name": "P2PU",
          "org": "School of Webcraft",
          "contact": "admin@p2pu.org"
        }
      }
    }
  },
  "http://foo.org/newbadge.json": {
    owner: true,
    exists: false,
    badge: {
      "recipient": "example@example.com",
      "evidence": "/badges/html5-basic/example",
      "badge": {
        "version": "0.5.0",
        "name": "HTML5 Fundamental",
        "image": "/_demo/by.large.png",
        "description": "Knows the difference between a <section> and an <article>",
        "criteria": "/badges/html5-basic",
        "issuer": {
          "origin": "http://p2pu.org",
          "name": "P2PU",
          "org": "School of Webcraft",
          "contact": "admin@p2pu.org"
        }
      }
    }
  },
  "http://foo.org/another_newbadge.json": {
    owner: true,
    exists: false,
    badge: {
      "recipient": "example@example.com",
      "evidence": "/badges/html6-basic/example",
      "badge": {
        "version": "0.5.0",
        "name": "HTML6 Fundamental",
        "image": "/_demo/cc.large.png",
        "description": "Knows the difference between a <sprite> and a <hamster>",
        "criteria": "/badges/html6-basic",
        "issuer": {
          "origin": "http://p2pu.org",
          "name": "P2PU",
          "org": "School of Webcraft",
          "contact": "admin@p2pu.org"
        }
      }
    }
  },
  "http://bar.org/oldbadge.json": {
    owner: true,
    exists: true,
    badge: {
      "recipient": "example@example.com",
      "evidence": "/badges/html4-basic/example",
      "badge": {
        "version": "0.5.0",
        "name": "HTML4 Fundamental",
        "image": "/_demo/cc.large.png",
        "description": "Knows the difference between a <p> and an <b>",
        "criteria": "/badges/html4-basic",
        "issuer": {
          "origin": "http://p2pu.org",
          "name": "P2PU",
          "org": "School of Webcraft",
          "contact": "admin@p2pu.org"
        }
      }
    }
  },
  "http://foo.org/explodeonissue.json": {
    owner: true,
    exists: false,
    badge: {
      "recipient": "example@example.com",
      "evidence": "/badges/html4-basic/example",
      "badge": {
        "version": "0.5.0",
        "name": "HTML4 Fundamental",
        "image": "/_demo/cc.large.png",
        "description": "Knows the difference between a <p> and an <b>",
        "criteria": "/badges/html4-basic",
        "issuer": {
          "origin": "http://p2pu.org",
          "name": "P2PU",
          "org": "School of Webcraft",
          "contact": "admin@p2pu.org"
        }
      }
    }
  }
};
var fakeResponseHandlers = {
  "POST /backpack/authenticate": function(options, cb) {
    if (Testing.browseridWorks)
      cb(200, 'OK', {
        json: {
          email: options.data.assertion
        }
      });
    else
      cb(400, 'Bad Request');
  },
  "POST /issuer/assertion": function(options, cb) {
    if (options.data.assertion == "http://foo.org/explodeonissue.json")
      cb(400, 'Bad Request', {
	      text: JSON.stringify({
	        message: "blah"
	      })
      });
    else
      cb(200, 'OK');
  },
  "GET /issuer/assertion": function(options, cb) {
    if (options.data.assertion in RESPONSES) {
      cb(200, 'OK', {json: RESPONSES[options.data.assertion]});
    } else
      cb(404, 'Not Found');
  }
};

jQuery.ajaxTransport("+*", function(options, originalOptions, jqXHR) {
  return {
    send: function(headers, completeCallback) {
      setTimeout(function() {
        var string = options.type + " " + originalOptions.url;
        if (string in fakeResponseHandlers) {
          fakeResponseHandlers[string]({
            data: originalOptions.data
          }, completeCallback);
        } else {
          completeCallback(404, 'Not Found');
        }
        //console.log("ajax", options.type, originalOptions.url, options, originalOptions, headers);
      }, FAKE_XHR_DELAY);
    },
    abort: function() {
      console.log('abort');
      throw new Error("abort() is not implemented!");
    }
  };
});

function checkDataObj(data){
  // badge.badge should really be assertion.badge
  var expectedElements = ['exists', 'badge.evidence', 'badge.recipient', 'badge.badge.name'];
  expectedElements.forEach(function(expectedElement){
    var value = _.reduce(expectedElement.split('.'), function(memo, key){ return memo[key]; }, data);
    notEqual(typeof value, undefined, expectedElement + ' is defined');
  });
}

module('Functional test');

asyncTest('Test', function(){
  var app = App(ASSERTION_URLS);

  app.on('badges-ready', function(failed, ready){
    deepEqual(_.map(failed, function(badge){ return badge.assertion; }),
      [
        'http://foo.org/nonexistent.json',
        'http://bar.org/oldbadge.json',
        'http://foo.org/notowner.json'
      ], 'expected failures from build'
    );
    ready.forEach(function(badge){
      badge.issue();
    });
    start();
  });

  app.on('badge-failed', function(badge){
    var error = badge.error;
    // This case won't have any real data
    if (error.reason === 'INACCESSIBLE') {
      equal(badge.assertion, 'http://foo.org/nonexistent.json');
      ok(error.message, 'has error message');
    }
    else {
      // We expect data here
      checkDataObj(badge.data);
      if (error.reason === 'EXISTS') {
	      equal(badge.assertion, 'http://bar.org/oldbadge.json');
      }
      else if (error.reason === 'INVALID') {
	      if (badge.data.owner) {
          equal(badge.assertion, 'http://foo.org/explodeonissue.json');
        }
        else {
          equal(badge.assertion, 'http://foo.org/notowner.json');
        }
      }
    }
  });

  app.on('badges-complete', function(failed, successes, total){
    equal(total, ASSERTION_URLS.length, 'all badges complete');
    deepEqual(_.map(failed, function(badge){ return badge.assertion; }),
      [
        'http://foo.org/nonexistent.json',
        'http://bar.org/oldbadge.json',
        'http://foo.org/notowner.json',
        'http://foo.org/explodeonissue.json'
      ], 'expected failures'
    );
    deepEqual(_.map(successes, function(badge){ return badge.assertion; }),
      [
        'http://foo.org/newbadge.json',
        'http://foo.org/another_newbadge.json'
      ], 'expected successes'
    );
    _.map(successes, function(success){ checkDataObj(success.data); });
    start();
  });

  app.start();
});
