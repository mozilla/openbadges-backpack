const urlutil = require('url');
const _ = require('underscore');

// `info` is the output from openbadges-validator
module.exports = function normalize(info) {
  if (info.version == '0.5.0')
    return info.assertion;

  const assertion = clone(info.assertion);
  assertion.badge = clone(info.badge);
  assertion.badge.issuer = clone(info.issuer);

  assertion._originalRecipient = info.assertion.recipient;
  assertion.recipient = info.assertion.recipient.id;
  if (info.assertion.recipient.salt)
    assertion.salt = info.assertion.recipient.salt;
  assertion.issued_on = info.assertion.issuedOn;
  assertion.badge._location = info.assertion.badge;
  assertion.badge.issuer._location = info.badge.issuer;
  assertion.badge.issuer.origin = originFromUrl(info.issuer.url);
  return assertion;
};

function originFromUrl(url) {
  const parts = urlutil.parse(url);
  return parts.protocol + '//'+ parts.host;
}

function clone(obj) {
  return _.extend({}, obj);
}