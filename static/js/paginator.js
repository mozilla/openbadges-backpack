/**
 * THE PAGINATOR
 *
 * Pagination widget that is addPage(target)'d for
 * each element that should be part of a pagination
 * set, returning the widget as DOM fragment when
 * calling finish().
 *
 * Comes with prev/next butons and setNo. pickers.
 *
 */
var Paginator = (function() {

  // object constructor
  var Paginator = function() {
    this.size = 0;
    this.curPage = 0;
    this.targets = [];
    this.pages = [];
    this.node = $("<div class='pages'></div>")[0];
  };

  // prototype definition
  Paginator.prototype = {
    size: 0,
    curPage: 0,
    targets: [],
    pages: [],
    node: null,

    // Add things to a collection container
    fillContainer: function(container, things, PAGE_SET_SIZE) {
      var paginator = this,
          s, set,
          setCount = 1 + ((things.length/PAGE_SET_SIZE)|0),
          runner = 0, runTotal=0, thing;

      // create sets
      for(s=0; s<setCount; s++) {
        set = $("<div class='set'></div>")[0];
        runTotal = s*PAGE_SET_SIZE;
        for(runner=0; runner<PAGE_SET_SIZE; runner++) {
          thing = things[runner + runTotal];
          if(!thing) break;
          set.appendChild(thing);
        }
        container.appendChild(set);
        paginator.addPage(set);
      }

      var paginationWidget = paginator.finish();
      if(paginator.size>1) {
        container.appendChild(paginationWidget);
      }
      return paginationWidget;
    },

    // add a target to the pagination list
    addPage: function(target) {
      var pageNo = this.size++,
          label = this.size;
      this.targets.push(target);
      page = $("<button class='boxed page'>"+label+"</button>").attr('data-page',pageNo)[0];
      this.pages.push(page);
      $(target).hide();
    },
    
    // select a specific page in this paginator
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
  
  // prototype constuctor binding
  Paginator.prototype.constructor = Paginator;

  // Return a pagination object
  return new Paginator();
}());
