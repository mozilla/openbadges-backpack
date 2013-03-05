const urlutil = require('url');
const _ = require('underscore');

// `validationInfo` is the output from openbadges-validator
module.exports = function normalize(validationInfo) {
  if (validationInfo.version == '0.5.0')
    return validationInfo.assertion;
  const original = validationInfo.assertion;
  const assertion = clone(validationInfo.assertion);
  const badge = assertion.badge = validationInfo.badge;
  const issuer = assertion.badge.issuer = validationInfo.issuer;
  assertion.recipient = original.recipient.id;
  if (original.recipient.salt)
    assertion.salt = original.recipient.salt;
  assertion.issued_on = original.issuedOn;
  badge.url = original.badge;
  issuer.origin = originFromUrl(issuer.url);
  return assertion;
};

function originFromUrl(url) {
  const parts = urlutil.parse(url);
  return parts.protocol + '//'+ parts.host;
}

function clone(obj) {
  return _.extend({}, obj);
}