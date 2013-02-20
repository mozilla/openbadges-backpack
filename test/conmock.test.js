const test = require('tap').test;
const conmock = require('./conmock');

test('res.send()', function (t) {
  function handler(req, res, next) {
    res.send('okay', 200);
  }
  conmock({ handler: handler }, function (err, mock) {
    t.same(mock.fntype, 'send');
    t.same(mock.status, '200');
    t.same(mock.body, 'okay');
  });
  t.end();
});

test('res.json()', function (t) {
  function handler(req, res, next) {
    res.json({ message: 'yup' }, 200);
  }
  conmock({ handler: handler }, function (err, mock) {
    t.same(mock.fntype, 'json');
    t.same(mock.status, '200');
    t.same(mock.body, { message: 'yup'});
  });
  t.end();
});

test('res.render()', function (t) {
  const renderOptions = {some: 'thing', status: 404};
  function handler(req, res, next) {
    res.render('ohai.html', renderOptions);
  }
  conmock({ handler: handler}, function (err, mock) {
    t.same(mock.fntype, 'render');
    t.same(mock.path, 'ohai.html');
    t.same(mock.status, 404);
    t.same(mock.options, renderOptions);
  });
  t.end();
});

test('res.header()', function (t) {
  function handler(req, res, next) {
    res.header('o', 'hai');
    res.header('wut', 'lol');
    res.send('okay');
  }
  conmock({ handler: handler }, function (err, mock) {
    t.same(mock.headers['o'], 'hai');
    t.same(mock.headers['wut'], 'lol');
  });
  t.end();
});

test('next()', function (t) {
  function handler(req, res, next) {
    req.stuff = 'some stuff';
    next();
  }
  conmock({ handler: handler }, function (err, mock, req) {
    t.same(req.stuff, 'some stuff');
    t.same(mock.fntype, 'next');
  })
  t.end();
});

test('options.param', function(t) {
  conmock({
    handler: function(req, res, next, param) {
      req.passedInParam = param;
      next();
    },
    param: 'lol'
  }, function(err, mock) {
    if (err) throw err;
    t.equal(mock.request.passedInParam, 'lol');
    t.end();
  });
});

test('res.contentType', function (t) {
  function handler(type) {
    return function (req, res, next) {
      res.contentType(type);
      res.send('okay');
    }
  }
  conmock({ handler: handler('json') }, function (err, mock) {
    t.same(mock.headers['Content-Type'], 'application/json');
  });
  conmock({ handler: handler('html') }, function (err, mock) {
    t.same(mock.headers['Content-Type'], 'text/html');
  });
  conmock({ handler: handler('txt') }, function (err, mock) {
    t.same(mock.headers['Content-Type'], 'text/plain');
  });

  t.plan(3);
});

