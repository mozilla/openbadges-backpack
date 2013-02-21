"use strict";

defineTests([], function() {
  var MS_PER_DAY = 1000 * 60 * 60 * 24;
  var formatDate = function(date) {
    return date.getFullYear() + '-' +
           (date.getMonth() + 1) + '-' +
           date.getDate();
  };

  module('Backpack');

  test('Badge.isExpired() returns false', function(){
    var badge = new Badge.Model();
    var tomorrow = new Date(Date.now() + MS_PER_DAY);
    badge.attributes.body = {expires: formatDate(tomorrow)};
    equal(badge.isExpired(), false);
  });

  test('Badge.isExpired() returns true', function(){
    var badge = new Badge.Model();
    var yesterday = new Date(Date.now() - MS_PER_DAY);
    badge.attributes.body = {expires: formatDate(yesterday)};
    equal(badge.isExpired(), true);
  });
});
