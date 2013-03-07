const urlutil = require('url');
const _ = require('underscore');

// `info` is the output from openbadges-validator
module.exports = function normalize(info) {
  if (info.version == '0.5.0')
    return info.structures.assertion;

  const structures = info.structures;
  const assertion = clone(structures.assertion);
  assertion.badge = clone(structures.badge);
  assertion.badge.issuer = clone(structures.issuer);

  assertion._originalRecipient = structures.assertion.recipient;
  assertion.recipient = structures.assertion.recipient.identity;
  if (structures.assertion.recipient.salt)
    assertion.salt = structures.assertion.recipient.salt;
  assertion.issued_on = structures.assertion.issuedOn;
  assertion.badge._location = structures.assertion.badge;
  assertion.badge.issuer._location = structures.badge.issuer;
  assertion.badge.issuer.origin = originFromUrl(structures.issuer.url);
  return assertion;
};

function originFromUrl(url) {
  const parts = urlutil.parse(url);
  return parts.protocol + '//'+ parts.host;
}

function clone(obj) {
  return _.extend({}, obj);
}