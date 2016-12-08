const appUtils = require('./app-utils');

appUtils.prepareApp(function(a) {
  var headers = {accept: 'application/json'};

  a.verifyRequest('POST', '/backpack/authenticate', {
    form: {'assertion': 'BAD ASSERTION'},
    headers: headers
  }, {
    statusCode: 400,
    body: {
      status: "error",
      reason: 'browserID verification failed: expected "yup, it is example@example.com." but got "BAD ASSERTION"'
    }
  });

  a.verifyRequest('POST', '/backpack/authenticate', {
    headers: headers
  }, {
    statusCode: 400,
    body: {
      status: "error",
      reason: "assertion expected"
    }
  });

  a.verifyRequest('POST', '/backpack/authenticate', {
    form: {'assertion': a.assertion},
    headers: headers
  }, {
    statusCode: 200,
    body: {
      status: "ok",
      email: a.email
    }
  });

  a.end();
});

appUtils.prepareApp(function(a) {
  a.verifyRequest('GET', '/404', {statusCode: 404});
  a.verifyRequest('GET', '/backpack/login', {
    statusCode: 200,
    body: function(t, body) {
      var re = /name="_csrf" type="hidden" value="(.*)"/;
      var match = body.match(re);
      t.equal(match[1], a.csrf, "csrf exists in HTML");
    }
  });

  a.login();

  a.verifyRequest('GET', '/', {
    statusCode: 200,
    body: function(t, body) {
      t.ok(body.indexOf(a.email) > 0,
           "user email appears on home page when logged in");
    }
  });
  a.verifyRequest('GET', '/404', {statusCode: 404});
  a.verifyRequest('GET', '/backpack/signout', {statusCode: 200});

  a.verifyRequest('GET', '/', {
    statusCode: 200,
    body: function(t, body) {
      t.equal(body.indexOf(a.email), -1,
              "user email doesn't appear on home page when logged out");
    }
  });

  a.end();
});
