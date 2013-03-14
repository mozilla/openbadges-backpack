const jws = require('jws');
const http = require('http');
const express = require('express');
const path = require('path');
const app = express();
const keys = require('../test/test-keys.js');
const url = require('url');

app.use(express.static(path.join(__dirname, "static")));
app.use(express.bodyParser());

function makeHash (email, salt) {
  var sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

function makeUrl(req, path) {
  return url.resolve('http://'+req.headers.host, path);
}

app.post('/sign', function (req, res) {
  const email = req.body.email;
  res.send(jws.sign({
    header: { alg: 'rs256' },
    privateKey: keys.private,
    payload: {
      "badge": 'http://'+req.headers.host+'/badge.json',
      "uid": "f2c20",
      "recipient": {
        "type": "email",
        "hashed": true,
        "salt": "deadsea",
        "identity": makeHash(email, "deadsea")
      },
      "issuedOn": 1359217910,
      "verify": {
        "type": "signed",
        "url": 'http://'+req.headers.host+'/public-key'
      }
    },
  }));
});
app.get('/criteria', function (req, res) { res.send('criteria') })
app.get('/public-key', function (req, res) { res.send(keys.public) })
app.get('/badge.json', function (req, res) {
  res.json({
    "image": makeUrl(req, '/badge.png'),
    "criteria": makeUrl(req, '/criteria'),
    "issuer": makeUrl(req, '/issuer.json'),
    "name": "Awesome Robotics Badge",
    "description": "For doing awesome things with robots that people think is pretty great.",
  })
})
app.get('/issuer.json', function (req, res) {
  res.json({
    "name": "An Example Badge Issuer",
    "url": makeUrl(req, '/'),
    "email": "steved@example.org",
  })
})
app.get('/raw.json', function (req, res) {
  return res.json({
    "badge": makeUrl(req, '/badge.json'),
    "uid": "f2c20",
    "recipient": {
      "type": "email",
      "hashed": false,
      "identity": req.query.email
    },
    "issuedOn": 1359217910,
    "verify": {
      "type": "hosted",
      "url": makeUrl(req, '/raw.json?email=' + req.query.email)
    }
  });
});

app.get('/old.json', function (req, res) {
  return res.json({
    recipient: req.query.email,
    badge: {
      version: '0.5.0',
      name: 'Badge',
      description: 'Description',
      image: makeUrl(req, '/badge.png'),
      criteria: makeUrl(req, '/criteria'),
      issuer: {
        name: 'Issuer',
        origin: makeUrl(req, '/')
      }
    }
  });
});

app.get('/hashed.json', function (req, res) {
  var salt = 'yah';
  return res.json({
    "badge": makeUrl(req, '/badge.json'),
    "uid": "f2c20",
    "recipient": {
      "type": "email",
      "hashed": true,
      "salt": salt,
      "identity": makeHash(req.query.email, salt)
    },
    "issuedOn": 1359217910,
    "verify": {
      "type": "hosted",
      "url": makeUrl(req, '/hashed.json?email=' + req.query.email)
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
