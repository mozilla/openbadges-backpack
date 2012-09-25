<div class="row backpack">
  <div class="span8 column badges">
  
    <header>
      <div class="title">Badges</div>
      <div class="addendum">Looking a bit bare? <a href="badges!">Earn more badges!</a></div>
    </header>

    <div class="collection">
      <!-- sets of badges (16 at a time) go here -->
    </div>

    <div class="footer">
     <p>badge footer. With toes (also, an <span class="btn">upload</span> button)</p>
    </div>
  </div>
  
  <div class="span4 column groups">
    <section>
      <header>
        <div class="title">Groups</div>
      </header>
      
      <ul>
        <li>Placeholder</li>
        <li>Another Placeholder</li>
      </ul>
    </section>

    <section>
      <header>
        <div class="title">Tags</div>
      </header>

      <ul>
        <li>Tag</li>
        <li>Another tag</li>
        <li>Lolcat</li>
        <li>Badges</li>
      </ul>      
    <section>

  </div>
</div>

<style>

  html {
    background: none;
  }

  body {
    background: #EEE;
  }

  .backpack header {
    width: 100%;
    /* larges font size is 220% */
    height: 2.2em;
  }
  
  .backpack header .title {
    font-size: 220%;
    font-weight: bold;
  }

  .backpack header .title {
    float: left;
  }

  .backpack header .addendum {
    float: right;
    font-weight: bold;
    line-height: 2.2em;
  }

  .backpack header .addendum a {
    color: black;
    text-decoration: underline;
  }
  
  .badges .collection {
    background: white;
    border-radius: 15px;
    padding-top: 20px;
    margin: 1em 0;
    line-height: 120px;
  }

  .backpack .footer h1 {
    font-size: 200%;
  }
  
  .badges p {
    font-weight: bold;
    margin: 0;
    padding: 0;
  }

  .badges p+p {
    margin-top: 1em;
  }
  
  .badges .badge {
    padding: 0; /* override */;
    width: 110px;
    height: 110px;
    margin: 0 20px;
    border-radius: 100px;
    border: 1px solid #494949;
    display: inline-block;
    background: #d6d6d6;
    text-align: center;

    /* TESTING ONLY */
    color: white;
    font-size: 100px;
    line-height: 100px;
  }
  
  .groups section + section {
    margin-top: 3em;
  }

  .groups ul {
    margin-top: 1em;
  }
  
  .pages {
    text-align: right;
    line-height: 1em;
    padding: 1em;
  }
  
  .boxed {
    background: #EEE;
    border: 1px solid black;
    width: 25px;
    height: 25px;
    text-align: center;
    cursor: pointer;
  }
  
  .boxed + .boxed {
    margin-left: 0.2em;
  }

  .boxed.previous,
  .boxed.next {
    background: #FFD !important;
  }
  
  .boxed:hover {
    background: white !important;
  }
  
  .boxed.highlight {
    border: 3px solid black;
  }
</style>

<script type="text/javascript">
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

  /**
   * Generate a wad of badges (HTML)
   */
  function generateBadges() {
    var i, last=123,
        badges = [],
        title="badges!";
    for(i=0; i<last; i++) {
      badges[i] = $("<div class='badge'>" + 
                    title[(Math.random()*7)|0] +
                    "</div>")[0]; }
    return badges;
  }
  
  /**
   * Add badges to a collection container
   */
  function addToContainer(container, badges) {
    var paginator = new Paginator(),
        s, set,
        setSize = 16,
        setCount = 1 + ((badges.length/setSize)|0),
        runner = 0, runTotal=0, badge;

    // create sets
    for(s=0; s<setCount; s++) {
      set = $("<div class='set'></div>")[0];
      runTotal = s*setSize;
      for(runner=0; runner<setSize; runner++) {
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
        badges = generateBadges();
    addToContainer(container, badges);
  }

  // kickstart
  document.addEventListener("DOMContentLoaded",test,false);

}());
</script>    
