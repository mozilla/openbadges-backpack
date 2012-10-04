var express = require('express');
var path = require('path');
var app = express.createServer();
app.use(express.static(path.join(__dirname, "static")));

function makeHash (email, salt) {
  var sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

app.get('/raw.json', function (request, response) {
  return response.send({
    recipient: request.query.email||'brian@mozillafoundation.org',
    evidence: '/whatever.html',
    expires: '2040-08-13',
    issued_on: '2011-08-23',
    badge: {
      version: 'v0.5.0',
      name: 'Open Source Contributor',
      description: 'For rocking in the free world',
      image: '/badge.png',
      criteria: 'http://example.com/criteria.html',
      issuer: {
        origin: 'http://localhost:8889',
        name: 'yep',
        contact: 'admin@sup.org'
      }
    }
  });
});

app.get('/hashed.json', function (request, response) {
  var salt = 'yah';
  return response.send({
    recipient: makeHash(request.query.email||'brian@mozillafoundation.org', salt),
    salt: salt,
    evidence: '/whatever.html',
    expires: '2040-08-13',
    issued_on: '2011-08-23',
    badge: {
      version: 'v0.5.0',
      name: 'Open Source Contributor',
      description: 'For rocking in the free world',
      image: '/badge.png',
      criteria: 'http://example.com/criteria.html',
      issuer: {
        origin: 'http://localhost:8889',
        name: 'yep',
        contact: 'admin@sup.org'
      }
    }
  });
});

app.get('/invalid.json', function (request, response) {
  return response.send({
    recipient: request.query.email||'brian@mozillafoundation.org',
    evidence: '/whatever.html',
    expires: '2040-08-13',
    issued_on: '2011-08-23'
  });
});

console.log(process.pid);
app.listen(8889);
