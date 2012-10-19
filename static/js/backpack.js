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

    // Twitter bootstrap popover() has a "bug" in that it
    // binds the popover position when the popover call is
    // made, rather than checking where it should place the
    // popover when it should be shown. This means that if
    // we add popover behaviour during Badge creation, in
    // the BadgeCollection, the position will be completely
    // wrong, and popovers will be at absolute (0,-67).
    var badges = $(".badge");
    badges.popover({delay: 200});
    badges.mousedown(function() { $(this).popover('hide'); });
  };
  document.addEventListener("DOMContentLoaded", setupUX, false);
}());