<div class="row backpack">
  <div class="span8 column badges">

    <header>
      <div class="title">Badges</div>
      <div class="addendum">Looking a bit bare? <a href="badges!">Earn more badges!</a></div>
    </header>

    {{#badges.length}}
    <div class="collection">
      {{#badges}}
      <div draggable="true"
           class="badge"
           data-id="{{attributes.id}}"
           rel="popover"
           data-content="Description: {{attributes.body.badge.description}}<br>
                         Issuer: {{attributes.body.badge.issuer.name}}"
           data-original-title="{{attributes.body.badge.name}}"
           style="background: url('{{attributes.image_path}}'); background-size: 100% 100%"></div>
      {{/badges}}
    </div>
    {{/badges.length}}

    <div class="footer">
     <p>badge footer. With toes (also, an <span class="btn">upload</span> button)</p>
    </div>
  </div>

  <div class="span4 column groups">
    {{#groups.length}}
    <section>
      <header>
        <div class="title">Groups</div>
      </header>

      <ul class="listing">
        {{#groups}}
        <li class="group" data-id="{{group.id}}"><a href="share/{{attributes.url}}/">{{attributes.name}}</a></li>
        {{/groups}}
      </ul>

      <button class="create btn">Create New Group</button>

    </section>
    {{/groups.length}}

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
    padding: 10px 0;
    margin: 1em 0;
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
    margin: 10px 20px;
    border-radius: 100px;
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
    list-style: none;
    margin-left: 0;
  }

  .groups .group a {
    color: black;
    text-decoration: underline;
    font-weight: bold;
  }

  .pages {
    text-align: right;
    line-height: 1em;
    padding: 1em;
  }

  .boxed {
    background: white;
    border: 1px solid grey;
    border-radius: 4px;
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
    background: #999 !important;
    color: white;
  }

  .boxed.previous + .boxed {
    margin-left: 0.7em;
  }
  .boxed + .boxed.next {
    margin-left: 0.7em;
  }

  .boxed:hover {
    background: #CCC !important;
  }

  .boxed.highlight {
    border: 1px solid #444;
    background: #EEE;
  }

  .btn {
    border-radius: 2em;
    padding: 0.5em 1.5em;

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
    (Bootstrap.js is loaded in layout.hogan.js)
  **/
  function badgePopOvers() {
    document.removeEventListener("DOMContentLoaded",badgePopOvers,false);
    $(".badge").popover({delay: 200});
  }
  document.addEventListener("DOMContentLoaded",badgePopOvers,false);


  // ============================================


  function init() {
    document.removeEventListener("DOMContentLoaded", init, false);

    function loadTemplate() {
      var newGroup = $("<li>Pretended to load the new group 'template'." +
                        "<span class='editable'><br>" +
                        "<button class='btn save'>save</button> " +
                        "<button class='btn cancel'>cancel</button> " +
                        "</span></li>");
      return newGroup;
    }

    function loadTemplateInto(template, selector) {
      var listing = $(selector);
      listing.append(template);
    }

    var createButton = $(".groups button.create"),
        creating = false,
        enableButton = function() { creating = false; createButton.fadeIn(); };

    createButton.click(function(btn) {
      if(creating) return;
      createButton.hide();
      creating = true;

      var template = loadTemplate();

      $(".cancel", template).click(function() {
        var li = $(this).closest("li");
        li.remove();
        enableButton();
      });

      $(".save", template).click(function() {
        $(".editable", template).remove();
        enableButton();
      });

      loadTemplateInto(template, ".groups .listing");
    });
  }
  document.addEventListener("DOMContentLoaded", init, false);

}());
</script>
