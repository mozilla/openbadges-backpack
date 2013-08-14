var testUtil = require('./lib/util');

describe("app", function() {
  it("returns 'HELLO WORLD' at /", function(done) {
    testUtil.request()
      .get('/')
      .expect(200)
      .expect('HELLO WORLD')
      .end(done);
  });
});
