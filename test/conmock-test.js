var vows = require('vows')
var assert = require('assert')
var should = require('should')
var conmock = require('./conmock.js')



vows.describe('Connection mocking').addBatch({
  'Mocker': {
    '#send' : {
      topic: function () {
        function wut (request, response, next) { response.send('okay', 200) };
        conmock(wut, {}, this.callback);
      },
      'and knows what was sent' : function (err, mock) {
        mock.fntype.should.equal('send');
        mock.status.should.equal(200);
        mock.body.should.equal('okay');
      },
    },
    '#json' : {
      topic: function () {
        function wut (request, response, next) { response.json({message: 'yup'}, 200) };
        conmock(wut, {}, this.callback);
      },
      'and knows what was sent' : function (err, mock) {
        mock.fntype.should.equal('json');
        mock.status.should.equal(200);
        mock.body.message.should.equal('yup');
      },
    },
    '#render' : {
      topic: function () {
        function wut (request, response, next) {
          response.statusCode = 'fffffffuuuuuuuuuuuu';
          response.render('ohai', {some: "thing", status: 404})
        };
        conmock(wut, {}, this.callback);
      },
      'and knows the options and the render path' : function (err, mock) {
        mock.fntype.should.equal('render');
        mock.path.should.equal('ohai');
        mock.status.should.equal(404);
        mock.options.some.should.equal('thing');
      },
    },
    '#header' : {
      topic: function () {
        function wut (request, response, next) {
          response.header('oh', 'hai');
          response.send('okay')
        };
        conmock(wut, {}, this.callback);
      },
      'and knows the options and the render path' : function (err, mock) {
        mock.fntype.should.equal('send');
        mock.status.should.equal(200);
        mock.headers['oh'].should.equal('hai');
      },
    },
    '#next': {
      topic: function () {
        function mware (request, response, next) {
          response.header('oh', 'hai');
          next();
        };
        conmock(mware, {}, this.callback);
      },
      'callback gets called, knows headers': function (err, mock) {
        mock.headers['oh'].should.equal('hai');
      }
    },

    '#contentType' : {
      'given "json"': {
        topic: function () {
          function wut (request, response, next) { response.contentType('json'); response.send('okay') };
          conmock(wut, {}, this.callback);
        },
        'content-type should be "application/json"' : function (err, mock) {
          mock.headers['Content-Type'].should.equal('application/json');
        },
      },
      'given "txt"': {
        topic: function () {
          function wut (request, response, next) { response.contentType('txt'); response.send('okay') };
          conmock(wut, {}, this.callback);
        },
        'content-type should be "text/plain"' : function (err, mock) {
          mock.headers['Content-Type'].should.equal('text/plain');
        },
      },
      'given "html"': {
        topic: function () {
          function wut (request, response, next) { response.contentType('html'); response.send('okay') };
          conmock(wut, {}, this.callback);
        },
        'content-type should be "text/plain"' : function (err, mock) {
          mock.headers['Content-Type'].should.equal('text/html');
        },
      }
    },
  }
}).export(module);