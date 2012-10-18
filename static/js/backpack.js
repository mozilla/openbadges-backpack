// TODO: This code belongs in a view for the main
//       badge area, rather than as plain script
//       in the page itself.
(function(){

  /**
   * THE PAGINATOR
   *
   * Pagination widget that is addPage(target)'d
   * for each element that should be part of a pagination
   * set, returning the widget as DOM fragment when calling
   * finish(). Comes with prev/next controllers
   *
   */
  var Paginator = function() {
    this.size = 0;
    this.curPage = 0;
    this.targets = [];
    this.pages = [];
    this.node = $("<div class='pages'></div>")[0];
  };
  Paginator.prototype = {
    size: 0,
    curPage: 0,
    targets: [],
    pages: [],
    node: null,
    // add a target to the pagination list
    addPage: function(target) {
      var pageNo = this.size++,
          label = this.size;
      this.targets.push(target);
      page = $("<button class='boxed page'>"+label+"</button>").attr('data-page',pageNo)[0];
      this.pages.push(page);
      $(target).hide();
    },
    select: function(pageNo) {
      this.pages[pageNo].click();
    },
    // hook up the paginating behaviour and
    // add the navigation elements
    finish: function() {
      var targets = $(this.targets),
          node = this.node,
          pages = this.pages,
          paginator = this;

      pages.forEach(function(element) {
        var page = $(element);
        page.click(function() {
          $(pages).removeClass("highlight");
          $(targets).hide();
          paginator.curPage = page.attr('data-page');
          $(targets[paginator.curPage]).show();
          page.addClass("highlight");
        });
        node.appendChild(element);
      });

      var initial = node.childNodes[0],
           previous = $("<button class='boxed page previous'>&lt;</button>")[0],
           next = $("<button class='boxed page next'>&gt;</button>")[0];

      $(previous).click(function() {
        if(paginator.curPage>0) {
          paginator.curPage--;
          paginator.select(paginator.curPage);
        }
        return false;
      });

      $(next).click(function() {
        if(paginator.curPage<paginator.size-1) {
          paginator.curPage++;
          paginator.select(paginator.curPage);
        }
        return false;
      });

      node.insertBefore(previous, initial);
      node.appendChild(next);
      this.select(0);
      return this.node;
    },
  };

  // ============================================

  var PAGE_SET_SIZE = 8;

  /**
   * Get the set of on-page badges
   */
  function getBadges() {
    // straight pull, no processing
    return $('.backpack .collection .badge');
  }

  /**
   * Add badges to a collection container
   */
  function addToContainer(container, badges) {
    var paginator = new Paginator(),
        s, set,
        setCount = 1 + ((badges.length/PAGE_SET_SIZE)|0),
        runner = 0, runTotal=0, badge;

    // create sets
    for(s=0; s<setCount; s++) {
      set = $("<div class='set'></div>")[0];
      runTotal = s*PAGE_SET_SIZE;
      for(runner=0; runner<PAGE_SET_SIZE; runner++) {
        badge = badges[runner + runTotal];
        if(!badge) break;
        set.appendChild(badge);
      }
      container.appendChild(set);
      paginator.addPage(set);
    }

    var paginationWidget = paginator.finish();
    if(paginator.size>1) {
      container.appendChild(paginationWidget);
    }
  }

  /**
   * Test pagination
   */
  function test() {
    document.removeEventListener("DOMContentLoaded",test,false);
    var container = $('.badges .collection')[0],
        badges = getBadges();
    addToContainer(container, badges);
  }

  // kickstart
  document.addEventListener("DOMContentLoaded",test,false);


  // ============================================


  /**
    Bootstrap popover detail panels for badges
  **/
  function badgePopOvers() {
    document.removeEventListener("DOMContentLoaded",badgePopOvers,false);
    var badges = $(".badge");
    //  spawn popovers on a 200ms delay
    badges.popover({delay: 200});
    // but kill them off on mouse clicks
    badges.mousedown(function() { $(this).popover('hide'); });
  }
  document.addEventListener("DOMContentLoaded",badgePopOvers,false);
}());