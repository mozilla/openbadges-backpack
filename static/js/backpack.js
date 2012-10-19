/**
 * Set up the page UX, by letting the backbone group listing
 * implementation take over from the static page content.
 */
(function() {
  function setupUX() {
    document.removeEventListener("DOMContentLoaded", setupUX, false);

    // create badge collection backbone
    var badges = BadgeCollection.fromElement($(".badges .collection"));

    // create group listing backbone (tied to the badges collection)
    var listing = GroupListing.fromElement($(".groups"), badges); 

    /**
      Bootstrap popover detail panels for badges
    **/
    var badges = $(".badge");
    badges.popover({delay: 200});
    badges.mousedown(function() { $(this).popover('hide'); });
  };
  document.addEventListener("DOMContentLoaded", setupUX, false);
}());