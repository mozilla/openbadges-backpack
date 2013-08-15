var should = require('should');

var testUtil = require('./lib/util');

describe("persona middleware", function() {
  it('defines PERSONA_JS_URL in app.locals', function() {
    testUtil.app().locals.PERSONA_JS_URL
      .should.match(/persona\.org\/include\.js/);
  });

  it('defines POST /persona/verify', function() {
    testUtil.app()._router.matchRequest({
      method: 'POST',
      url: '/persona/verify'
    }).should.be.a('object');
  });

  it('defines POST /persona/logout', function() {
    testUtil.app()._router.matchRequest({
      method: 'POST',
      url: '/persona/logout'
    }).should.be.a('object');
  });  
});
