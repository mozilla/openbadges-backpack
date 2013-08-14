var request = require('supertest');

var backpack = require('../');

describe("app", function() {
  it("returns 'HELLO WORLD' at /", function(done) {
    request(backpack.app.build())
      .get('/')
      .expect(200)
      .expect('HELLO WORLD')
      .end(done);
  });
});
