"use strict";

function uniqueEmailsOnly(emails) {
    var observed = {};
    var values = [];
    var length = emails.length;
    var count = 0;
    for(var i = 0; i < length; i++) {
         var item = emails[i];
         if(observed[item] !== 1) {
               observed[item] = 1;
               values[count++] = item;
         }
    }
    return values;
}

// build a very simple (non-comprehensive) list of potential email variations
exports.variations = function variations(email) {

  var emailVariations = [];

  emailVariations.push(email); // email as we have it on record
  emailVariations.push(email.toLowerCase()); // email all lowercase
  emailVariations.push(email.toUpperCase()); // email all uppercase
  emailVariations.push(email.charAt(0).toUpperCase() + email.substr(1).toLowerCase()); // uppercase first character, lowercase everything else 
  emailVariations.push(email.replace(/\w+/g, function (x) {
    return x[0].toUpperCase() + x.slice(1).toLowerCase();
  })); // uppercase first char, then every alpha char after every special char
  emailVariations.push(email.substr(0,email.indexOf('@')).toUpperCase() + email.substring(email.indexOf('@')).toLowerCase()); // uppercase everything before the @ symbol

  // trim dupes
  emailVariations = uniqueEmailsOnly(emailVariations);

  return emailVariations;
};
