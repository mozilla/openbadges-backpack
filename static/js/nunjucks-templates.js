(function() {
var templates = {};
templates["addBadge.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n\n");
var t_2 = "badges";
frame.set("activeNav", t_2);
if(!frame.parent) {
context.setVariable("activeNav", t_2);
context.addExport("activeNav");
}
output += runtime.suppressValue("\n\n");
output += context.getBlock("body")(env, context, frame, runtime);
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n  ");
output += context.getBlock("badgeNav")(env, context, frame, runtime);
output += runtime.suppressValue("\n\n  <h3>Upload Badges</h3>\n  <p>If you have badges you've been awarded, you can upload them manually</p>\n  <form action=\"/backpack/badge\" method=\"post\" enctype=\"multipart/form-data\">\n    <fieldset>\n      <div class=\"clearfix\">\n        <input type=\"hidden\" name=\"_csrf\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\"></input>\n        <input id=\"userBadge\" type=\"file\" name=\"userBadge\" accept=\"image/png\"></input>\n      </div>\n    </fieldset>\n    <div class=\"clearfix\">\n      <input class=\"btn btn-primary\" type=\"submit\" value=\"Upload\"></input>\n    </div>\n  </form>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_badgeNav(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "badgeNav", b_badgeNav, frame, runtime);
output += runtime.suppressValue("\n    <p class=\"badge-nav\">\n      <span class=\"hide\">Show</span>\n      <a href=\"/\">Recent</a>\n      <span class=\"hide\">,</span>\n      <a href=\"/backpack/badges\">Everything</a>\n      <span class=\"hide\">or</span>\n      <a href=\"/backpack/add\" class=\"selected upload-badge\">Upload</a>\n      <span class=\"hide\">a new badge</span>\n    </p>\n  ");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
b_badgeNav: b_badgeNav,
root: root
};

})();
templates["allBadges.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("badges.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n\n");
var t_2 = "all";
frame.set("selectedBadgeTab", t_2);
if(!frame.parent) {
context.setVariable("selectedBadgeTab", t_2);
context.addExport("selectedBadgeTab");
}
output += runtime.suppressValue("\n\n");
output += context.getBlock("afterBadgeItems")(env, context, frame, runtime);
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_afterBadgeItems(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "afterBadgeItems", b_afterBadgeItems, frame, runtime);
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_afterBadgeItems: b_afterBadgeItems,
root: root
};

})();
templates["backpack-connect.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
output += context.getBlock("head")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n\n");
output += context.getBlock("scripts")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_head(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "head", b_head, frame, runtime);
output += runtime.suppressValue("\n<style>\na.logout {\n  display: block;\n  padding-top: 20px;\n}\n</style>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<h1><span class=\"client\">");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "clientDomain"));
output += runtime.suppressValue("</span> would like permission \n  to:</h1>\n\n");
var t_2 = runtime.contextOrFrameLookup(context, frame, "scopes");
frame.set("permissions", t_2);
if(!frame.parent) {
context.setVariable("permissions", t_2);
context.addExport("permissions");
}
output += runtime.suppressValue("\n");
var includeTemplate = env.getTemplate("permissions.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n\n");
if(!runtime.contextOrFrameLookup(context, frame, "user")) {
output += runtime.suppressValue("\n\n<p>Want to create a Backpack?  \n  <a class=\"js-browserid-link\" href=\"#\">Sign up</a> to share your skills and interests, create badge collections, and more!</p>\n\n<a class=\"js-browserid-link\" href=\"#\">\n  <img src=\"https://browserid.org/i/sign_in_green.png\"/>\n</a>\n\n");
}
else {
output += runtime.suppressValue("\n\n<form method=\"POST\" action=\"accept\">\n  <input name=\"_csrf\" type=\"hidden\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\">\n  <input name=\"callback\" type=\"hidden\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "callback"));
output += runtime.suppressValue("\">\n  <input name=\"scope\" type=\"hidden\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "joinedScope"));
output += runtime.suppressValue("\">\n  <button class=\"btn btn-primary\" type=\"submit\">Grant permission</button>\n  <a class=\"btn\" href=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "denyCallback"));
output += runtime.suppressValue("\">Deny permission</a>\n  <a href=\"/backpack/signout\" class=\"logout\">\n    I am not <span class=\"email\">");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "user")),"attributes")),"email"));
output += runtime.suppressValue("</span>.\n  </a>\n</form>\n");
}
output += runtime.suppressValue("\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
output += runtime.suppressValue("\n<script src=\"https://login.persona.org/include.js\"></script>\n<script src=\"/js/jquery.min.js\"></script>\n<script>\n$(window).ready(function() {\n  var reloadPage = function() { window.location.reload(); };\n\n  $(document).ajaxError(function() {\n    alert(\"Sorry, an error occurred. Please try again later.\");\n  });\n  \n  $('a[href=\"/backpack/signout\"]').click(function() {\n    $.get($(this).attr(\"href\"), reloadPage);\n    return false;\n  });\n\n  $(\".js-browserid-link\").click(function() {\n    navigator.id.get(function(assertion) {\n      if (!assertion) return;\n      $.ajax({\n        url: '/backpack/authenticate',\n        type: 'POST',\n        dataType: 'json',\n        data: {assertion: assertion},\n        headers: {'X-CSRF-Token': '");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("'},\n        success: reloadPage\n      });\n    });\n    return false;\n  });\n});\n</script>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_head: b_head,
b_body: b_body,
b_scripts: b_scripts,
root: root
};

})();
templates["backpack.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n\n");
var t_2 = "collections";
frame.set("activeNav", t_2);
if(!frame.parent) {
context.setVariable("activeNav", t_2);
context.addExport("activeNav");
}
output += runtime.suppressValue("\n\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
output += context.getBlock("scripts")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n\n<form style=\"display: none\" action=''>\n  <input type=\"hidden\" name=\"_csrf\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\">\n</form>\n\n");
if(!runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badges")),"length")) {
output += runtime.suppressValue("\n  ");
var includeTemplate = env.getTemplate("no-badges.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n");
}
else {
output += runtime.suppressValue("\n<div class=\"row\" style=\"position: relative;\">\n\n  <div class=\"span4\">\n    <div class=\"row\">\n      <div class=\"sticky span4\">\n        <hgroup class=\"separator\">\n          <h2>My Collections</h2>\n          Organize badges the way you want\n        </hgroup>\n        <div id=\"groups\" class=\"scroll span4\">\n          ");
frame = frame.push();
var t_4 = runtime.contextOrFrameLookup(context, frame, "groups");
for(var t_3=0; t_3 < t_4.length; t_3++) {
var t_5 = t_4[t_3];
frame.set("group", t_5);
frame.set("loop.index", t_3 + 1);
frame.set("loop.index0", t_3);
frame.set("loop.revindex", t_4.length - t_3);
frame.set("loop.revindex0", t_4.length - t_3 - 1);
frame.set("loop.first", t_3 === 0);
frame.set("loop.last", t_3 === t_4.length - 1);
frame.set("loop.length", t_4.length);
output += runtime.suppressValue("\n          <div class='group' data-id=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"id"));
output += runtime.suppressValue("\" data-url=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"url"));
output += runtime.suppressValue("\">\n            <input class='groupName' type='text' value='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"name"));
output += runtime.suppressValue("' style='display: block'>\n            <span class='icon delete'>&times;</span>\n            <span class='icon share' ");
if(!runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"badgeObjects")) {
output += runtime.suppressValue("style='display: none'");
}
output += runtime.suppressValue(" title='Share this group'>5</span>\n            <span class='public'>\n              <label>\n                <input type='checkbox' class='js-privacy' ");
if(runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"public")) {
output += runtime.suppressValue("checked");
}
output += runtime.suppressValue(">\n                <span>public</span>\n              </label>\n            </span>\n\n            ");
frame = frame.push();
var t_7 = runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"badgeObjects");
for(var t_6=0; t_6 < t_7.length; t_6++) {
var t_8 = t_7[t_6];
frame.set("badge", t_8);
frame.set("loop.index", t_6 + 1);
frame.set("loop.index0", t_6);
frame.set("loop.revindex", t_7.length - t_6);
frame.set("loop.revindex0", t_7.length - t_6 - 1);
frame.set("loop.first", t_6 === 0);
frame.set("loop.last", t_6 === t_7.length - 1);
frame.set("loop.length", t_7.length);
output += runtime.suppressValue("\n            <span draggable=\"true\" class=\"openbadge\" data-id=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_8),"attributes")),"id"));
output += runtime.suppressValue("\">\n              <img src=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_8),"attributes")),"imageUrl"));
output += runtime.suppressValue("\" width=\"64px\"/>\n            </span>\n            ");
}
frame = frame.pop();
output += runtime.suppressValue("\n          </div>\n          ");
}
frame = frame.pop();
output += runtime.suppressValue("\n\n          <div class='group isNew'>\n            <input class='groupName' type='text' value='New Collection'>\n            <span class='icon delete'>&times;</span>\n            <span class='icon share' title='share this group'>5</span>\n            <hgroup class=\"instructions\">\n              <h3>Drag a badge here</h3>\n              to create a Collection.\n            </hgroup>\n            <span class='public'>\n              <label>\n                <input type='checkbox' class='js-privacy'>\n                <span>public</span>\n              </label>\n            </span>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"span8 badge-area\">\n    <div class=\"row\">\n      <ul id=\"badges\" class=\"js-badges badge-list small-cards\">\n        ");
frame = frame.push();
var t_10 = runtime.contextOrFrameLookup(context, frame, "badges");
for(var t_9=0; t_9 < t_10.length; t_9++) {
var t_11 = t_10[t_9];
frame.set("badge", t_11);
frame.set("loop.index", t_9 + 1);
frame.set("loop.index0", t_9);
frame.set("loop.revindex", t_10.length - t_9);
frame.set("loop.revindex0", t_10.length - t_9 - 1);
frame.set("loop.first", t_9 === 0);
frame.set("loop.last", t_9 === t_10.length - 1);
frame.set("loop.length", t_10.length);
output += runtime.suppressValue("\n          <li class=\"span3 openbadge-container\">\n            <div class=\"openbadge\" data-id=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_11),"attributes")),"id"));
output += runtime.suppressValue("\">\n              <img src=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_11),"attributes")),"imageUrl"));
output += runtime.suppressValue("\" width=\"64\">\n              <p class=\"title\" title=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((t_11),"attributes")),"body")),"badge")),"name"));
output += runtime.suppressValue("\">");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((t_11),"attributes")),"body")),"badge")),"name"));
output += runtime.suppressValue("</p>\n              <p class=\"issuer\">Issuer: ");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((t_11),"attributes")),"body")),"badge")),"issuer")),"name"));
output += runtime.suppressValue("</p>\n            </div>\n          </li>\n        ");
}
frame = frame.pop();
output += runtime.suppressValue("\n      </ul>\n    </div>\n  </div>\n\n</div>\n");
}
output += runtime.suppressValue("\n\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
output += runtime.suppressValue("\n\n<!-- bootstrap some data -->\n<script>\n  window.badgeData = {};\n  ");
frame = frame.push();
var t_13 = runtime.contextOrFrameLookup(context, frame, "badges");
for(var t_12=0; t_12 < t_13.length; t_12++) {
var t_14 = t_13[t_12];
frame.set("badge", t_14);
frame.set("loop.index", t_12 + 1);
frame.set("loop.index0", t_12);
frame.set("loop.revindex", t_13.length - t_12);
frame.set("loop.revindex0", t_13.length - t_12 - 1);
frame.set("loop.first", t_12 === 0);
frame.set("loop.last", t_12 === t_13.length - 1);
frame.set("loop.length", t_13.length);
output += runtime.suppressValue("\n    window.badgeData[");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_14),"attributes")),"id"));
output += runtime.suppressValue("] = ");
output += runtime.suppressValue(runtime.suppressLookupValue((t_14),"serializedAttributes"));
output += runtime.suppressValue(";\n  ");
}
frame = frame.pop();
output += runtime.suppressValue("\n</script>\n\n<!-- third party -->\n");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "settings")),"env") == "production") {
output += runtime.suppressValue("\n  <script type=\"text/javascript\" src=\"/js/nunjucks-min.js\"></script>\n  <script type=\"text/javascript\" src=\"/js/nunjucks-templates.js\"></script>\n");
}
else {
output += runtime.suppressValue("\n  <script type=\"text/javascript\" src=\"/js/nunjucks-dev.js\"></script>\n");
}
output += runtime.suppressValue("\n<script type=\"text/javascript\" src=\"/js/underscore.js\"></script>\n<script type=\"text/javascript\" src=\"/js/backbone.js\"></script>\n<script type=\"text/javascript\" src=\"/vendor/bootstrap/js/bootstrap-alert.js\"></script>\n<script type=\"text/javascript\" src=\"/vendor/bootstrap/js/bootstrap-tooltip.js\"></script>\n<script type=\"text/javascript\" src=\"/vendor/bootstrap/js/bootstrap-popover.js\"></script>\n\n<!-- my libraries -->\n<script type=\"text/javascript\" src=\"/js/jquery.sync.js\"></script>\n<script type=\"text/javascript\" src=\"/js/backpack.js\"></script>\n\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
b_scripts: b_scripts,
root: root
};

})();
templates["badge-accept.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<!DOCTYPE html>\n<meta charset=\"utf-8\">\n<meta http-equiv=\"X-CSRF-Token\" content=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\">\n<meta http-equiv=\"X-Current-User\" content=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "email"));
output += runtime.suppressValue("\">\n");
if(runtime.contextOrFrameLookup(context, frame, "framed")) {
output += runtime.suppressValue("\n<script>\n  /* Requesting the framed badge acceptance screen from outside\n   * an iframe probably means we're coming from Persona's redirect\n   * on account creation. Let's kick over to the welcome screen instead.\n   */\n   if (window.top === window.self) {\n    window.location = \"/issuer/welcome\";\n  }\n</script>\n");
}
output += runtime.suppressValue("\n<link rel=\"stylesheet\" href=\"/css/badge-accept.css\" type=\"text/css\" media=\"all\" />\n<title>Accept Your Badges</title>\n<body class=\"");
if(runtime.contextOrFrameLookup(context, frame, "framed")) {
output += runtime.suppressValue("framed");
}
else {
output += runtime.suppressValue("frameless");
}
output += runtime.suppressValue("\">\n<div class=\"navbar navbar-fixed-top\">\n  <div class=\"navbar-inner\">\n    <div class=\"container-fluid\" style=\"position: relative;\">\n      <img class=\"brand\" src=\"/images/logo.png\" alt=\"Mozilla Backpack logo\" />\n      <img src=\"/images/ajax-loader.gif\" id=\"ajax-loader\">\n      <a class=\"close closeFrame\" href=\"#\">&times;</a>\n    </div>\n  </div>\n</div>\n\n<div id=\"body\" class=\"container-fluid\">\n  <div id=\"messages\"></div>\n  <div id=\"welcome\" class=\"narrow\" style=\"display: none\">\n    <div class=\"logged-out\">\n      <h2>Hoorah!</h2>\n      <p class=\"lead\">\n        You are about to send <strong class=\"badge-count\">a badge</strong>\n        to your Open Badges Backpack at <strong class=\"host\"></strong>.\n      </p>\n      <p class=\"lead\">Log in to do so.</p>\n      <a class=\"persona-button dark js-browserid-link\" href=\"#\">\n        <span>Log in or Sign up</span>\n      </a>\n    </div>\n    <div class=\"logged-in\">\n      <p class=\"lead\">You are about to send <strong class=\"badge-count\">a badge</strong>\n      to your Open Badges Backpack at <strong class=\"host\"></strong>.</p>\n      <button class=\"next btn btn-primary\">Hoorah!</button>\n      <a href=\"#\" class=\"logout\">\n        I am not <span class=\"email\"></span>.\n      </a>\n    </div>\n  </div>\n  <div id=\"farewell\" class=\"narrow\" style=\"display: none\">\n    <p class=\"badges-0 lead\" style=\"display: none\">You didn't add any open badges to your backpack.</p>\n    <p class=\"badges-1 lead\" style=\"display: none\">\n      You've sent <strong>1 badge</strong> to your Open Badges Backpack.\n    </p>\n    <p class=\"badges-many lead\" style=\"display: none\">\n      You've sent <strong class=\"badges-added\"></strong> badges to your\n      Open Badges Backpack.\n    </p>\n    <p class=\"lead\">\n      Visit your <a href=\"/\" target=\"_blank\">Backpack</a> to manage\n      and share your open badges.\n    </p>\n    <button class=\"next btn btn-primary\">Thanks</button>\n  </div>\n  <div id=\"badge-ask\" style=\"display: none\">\n  </div>\n  <div id=\"test-info\" style=\"display: none\">\n    <hr>\n    <p style=\"font-size: smaller\"><strong>This page is operating in test mode.</strong> All data and network operations\n    are simulated. For information on the API used to communicate with this\n    page, see the\n    <a href=\"https://github.com/mozilla/openbadges/wiki/Issuer-API\">Issuer\n    API Documentation</a>.</p>\n    <div class=\"log\"></div>\n  </div>\n</div>\n<div id=\"templates\" style=\"display: none\">\n  <div id=\"accept-failure-template\">\n    <div class=\"alert alert-error\">\n      <a class=\"close\">×</a>\n      <strong>Sorry!</strong> An error occurred when trying to add the\n      <em>[[ assertion.badge.name ]]</em> badge to your backpack.\n    </div>\n  </div>\n  <div id=\"already-exists-template\">\n    <div class=\"alert\">\n      <a class=\"close\">×</a>\n      You appear to already have the\n      <em>[[ assertion.badge.name ]]</em> badge in your backpack.\n    </div>\n  </div>\n  <div id=\"owner-mismatch-template\">\n    <div class=\"alert alert-error\">\n      <a class=\"close\">×</a>\n      It appears that the\n      <em>[[ assertion.badge.name ]]</em> badge was not awarded to you ([[ user ]]).\n    </div>\n  </div>\n  <div id=\"inaccessible-template\">\n    <div class=\"alert alert-error\">\n      <a class=\"close\">×</a>\n      We have encountered the following problem: <em>[[ error.message ]]</em>\n    </div>\n  </div>\n  <div id=\"login-error-template\">\n    <div class=\"alert alert-error\">\n      <strong>Sorry!</strong> An error occurred when trying to log you in.\n    </div>\n  </div>\n  <div id=\"badge-ask-template\" style=\"display: none\">\n    <div class=\"row\">\n      <div class=\"header span8\">\n        <h2>Accept this badge?</h2>\n        <button class=\"accept btn btn-primary\">Yes</button>\n        <button class=\"reject btn btn-danger\">No</button>\n      </div>\n      <div class=\"span3 columns management\">\n        <img class=\"badge-image\" src=\"[[assertion.badge.image]]\" alt=\"Badge Image\"/>\n      </div>\n      <div class=\"span5 columns badge-details\">\n        <dl>\n          <dt>Recipient</dt>\n\t        <dd>[[ unhashedRecipient ]]</dd>\n\n          <dt>Name</dt>\n          <dd>[[ assertion.badge.name ]]</dd>\n\n          <dt>Description</dt>\n          <dd>[[ assertion.badge.description ]]</dd>\n\n          <dt>Criteria</dt>\n          <dd><a href=\"[[assertion.badge.criteria]]\">[[ assertion.badge.criteria ]]</a></dd>\n\n          <dt>Issuer</dt>\n          <dd>[[ assertion.badge.issuer.name ]] (<a href=\"[[assertion.badge.issuer.origin]]\">[[ assertion.badge.issuer.origin ]]</a>)</dd>\n        </dl>\n      </div>\n    </div>\n  </div>\n</div>\n<script src=\"https://login.persona.org/include.js\"></script>\n<script src=\"/js/jquery.min.js\"></script>\n<script src=\"/js/jschannel.js\"></script>\n<script src=\"/js/underscore.js\"></script>\n<script src=\"/js/backbone.js\"></script>\n<script src=\"/js/badge-accept/badge-accept.js\"></script>\n<script src=\"/js/badge-accept/main.js\"></script>\n");
if(runtime.contextOrFrameLookup(context, frame, "framed")) {
output += runtime.suppressValue("\n  <script src=\"/js/badge-accept/build-channel.js\"></script>\n  <script>\n    $(window).ready(function(){\n      var channel = buildChannel();\n    });\n  </script>\n");
}
else {
output += runtime.suppressValue("\n  <script>\n    $(window).ready(function(){\n      window.issue(");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assertions"));
output += runtime.suppressValue(", function(){\n        window.location = \"/\";\n      });\n    });\n  </script>\n");
}
output += runtime.suppressValue("\n</body>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["badge-data.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<table class='information'>\n  <colgroup>\n    <col class=\"imageCol\">\n    <col class=\"fieldLabelCol\">\n    <col class=\"dataCol\">\n  </colgroup>\n  <tbody>\n    <tr>\n      <td rowspan=\"100\" class='image'>\n        <img src=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"imageUrl"));
output += runtime.suppressValue("\">\n        ");
if(runtime.contextOrFrameLookup(context, frame, "disownable")) {
output += runtime.suppressValue("\n        <button class='btn btn-danger disown'>Remove this Badge</button>\n\n        <!-- TODO: Re-enable this when sharing actually works well.\n                   We may drop the \"Share\" button altogether, but it's \n                   a nice guide for now.\n          <form action=\"/share/badge/");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"id"));
output += runtime.suppressValue("\" method=\"post\">\n            <input type=\"hidden\" name=\"_csrf\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\">\n            <input class=\"btn\" type=\"submit\" value=\"Share\">\n          </form>\n          <p class=\"facebook-share\">Facebook</p>\n          <p class=\"twitter-share\">Twitter</p>\n        -->\n        ");
}
output += runtime.suppressValue("\n      </td>\n\n      <td class='section-head' colspan='2'>Issuer Details</td>\n    </tr>\n    <tr>\n      <td class='fieldlabel issuer-name'>Name</td>\n      <td>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"issuer")),"name"));
output += runtime.suppressValue("</td>\n    </tr>\n    <tr>\n      <td class='fieldlabel issuer-name'>URL</td>\n      <td><a href=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"issuer")),"origin"));
output += runtime.suppressValue("\">");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"issuer")),"origin"));
output += runtime.suppressValue("</a></td>\n    </tr>\n    ");
if(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"issuer")),"org")) {
output += runtime.suppressValue("\n    <tr>\n      <td class='fieldlabel issuer-name'>Organization</td>\n      <td>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"issuer")),"org"));
output += runtime.suppressValue("</td>\n    </tr>\n    ");
}
output += runtime.suppressValue("\n\n    <tr>\n      <td class='section-head' colspan='2'>Badge Details</td>\n    </tr>\n    <tr>\n      <td class='fieldlabel'>Name</td>\n      <td>");
output += runtime.suppressValue(env.getFilter("escape")(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"name")));
output += runtime.suppressValue("</td>\n    </tr>\n    <tr>\n      <td class='fieldlabel'>Description</td>\n      <td>");
output += runtime.suppressValue(env.getFilter("escape")(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"description")));
output += runtime.suppressValue("</td>\n    </tr>\n    <tr>\n      <td class='fieldlabel'>Criteria</td>\n      <td><a href='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"criteria"));
output += runtime.suppressValue("'>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"criteria"));
output += runtime.suppressValue("</a></td>\n    </tr>\n\n    ");
if(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"evidence")) {
output += runtime.suppressValue("\n    <tr>\n      <td class='fieldlabel evidence'>Evidence</td>\n      <td><a href='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"evidence"));
output += runtime.suppressValue("'>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"evidence"));
output += runtime.suppressValue("</a></td>\n    </tr>\n    ");
}
output += runtime.suppressValue("\n\n    ");
if(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"issued_on")) {
output += runtime.suppressValue("\n    <tr>\n      <td class='fieldlabel'>Issued</td>\n      <td>");
output += runtime.suppressValue(env.getFilter("formatdate")(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"issued_on")));
output += runtime.suppressValue("</td>\n    </tr>\n    ");
}
output += runtime.suppressValue("\n\n    ");
if(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"expires")) {
output += runtime.suppressValue("\n    <tr>\n      <td class='fieldlabel'>Expiration</td>\n      <td>");
output += runtime.suppressValue(env.getFilter("formatdate")(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"expires")));
output += runtime.suppressValue("</td>\n    </tr>\n    ");
}
output += runtime.suppressValue("\n  </tbody>\n</table>\n\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["badge-details.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<div class='lightbox' data-id='");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "id"));
output += runtime.suppressValue("'>\n  <div class='contents badge-details'>\n    <header>\n      <h2>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"name"));
output += runtime.suppressValue("</h2>\n      <span class='close'>&times;</span>\n    </header>\n    <div class='body'>\n\n      <div class='confirm-disown'>\n        <p>\n          Do you want to remove this badge? </p>\n          <p> If so, you'd need to reconnect with the issuer (<a href='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"issuer")),"origin"));
output += runtime.suppressValue("'>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"issuer")),"name"));
output += runtime.suppressValue("</a>) to have this badge sent to your Backpack again.\n        </p>\n\n        <div class='buttons'>\n          <button class='btn nope'>Cancel</button>\n          <button class='btn yep btn-danger'>Yes</button>\n        </div>\n      </div>\n\n      <div class='confirm-facebook-share'>\n\t      ");
var includeTemplate = env.getTemplate("badge-facebook-share.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n\t    </div>\n      ");
var includeTemplate = env.getTemplate("badge-data.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n    </div>\n  </div>\n  <div class='background'></div>\n</div>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["badge-facebook-share.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<table class='information'>\n  <colgroup>\n    <col class=\"imageCol\">\n    <col class=\"dataCol\">\n  </colgroup>\n  <tbody class=\"confirm-facebook-share\">\n    <tr>\n      <td rowspan=\"80\" class='image'>\n        <img src=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"image_path"));
output += runtime.suppressValue("\">\n      </td>\n    </tr>\n    <tr>\n      <td>\n        <form action=\"/backpack/facebook\" method=\"POST\" class=\"facebook-share\">\n        <input type=\"hidden\" name=\"_csrf\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\"></input>\n        <input type=\"hidden\" name=\"badge_body_hash\" value=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body_hash"));
output += runtime.suppressValue("\"></input>\n        <strong>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"issuer")),"name"));
output += runtime.suppressValue("</strong>\n        <p>");
output += runtime.suppressValue(env.getFilter("escape")(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badge")),"attributes")),"body")),"badge")),"description")));
output += runtime.suppressValue("</p>\n        <textarea name='facebookcomment' tabindex=1 class='comment' placeholder='Add your personal comment'></textarea>\n        <span class=\"auto_push\"><input type=\"checkbox\" name=\"facebook_automatic_push\" value=\"facebook_automatic_push\">Automatically publish badges to Facebook when they are added to my backpack.</span></td>\n      </td>\n    </tr>\n    <tr>\n      <td>\n        <div class='buttons'>\n          <span class=\"btn nope\">Cancel</span>\n          <button class='btn yep btn-primary'>Share on Facebook</button>\n        </div>\n        </form>\n      </td>\n    </tr>\n  </tbody>\n</table>");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["badge-shared.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
var t_2 = " prefix=\"og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# open-badges: http://ogp.me/ns/fb/open-badges#\"";
frame.set("htmlPrefix", t_2);
if(!frame.parent) {
context.setVariable("htmlPrefix", t_2);
context.addExport("htmlPrefix");
}
output += runtime.suppressValue("\n");
output += context.getBlock("head")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_head(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "head", b_head, frame, runtime);
output += runtime.suppressValue("\n");
frame = frame.push();
var t_4 = runtime.contextOrFrameLookup(context, frame, "fb");
for(var t_3=0; t_3 < t_4.length; t_3++) {
var t_5 = t_4[t_3];
frame.set("facebook", t_5);
frame.set("loop.index", t_3 + 1);
frame.set("loop.index0", t_3);
frame.set("loop.revindex", t_4.length - t_3);
frame.set("loop.revindex0", t_4.length - t_3 - 1);
frame.set("loop.first", t_3 === 0);
frame.set("loop.last", t_3 === t_4.length - 1);
frame.set("loop.length", t_4.length);
output += runtime.suppressValue("<meta property=\"fb:");
output += runtime.suppressValue(runtime.suppressLookupValue((t_5),"property"));
output += runtime.suppressValue("\" content=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((t_5),"content"));
output += runtime.suppressValue("\" />\n");
}
frame = frame.pop();
output += runtime.suppressValue("");
frame = frame.push();
var t_7 = runtime.contextOrFrameLookup(context, frame, "og");
for(var t_6=0; t_6 < t_7.length; t_6++) {
var t_8 = t_7[t_6];
frame.set("opengraph", t_8);
frame.set("loop.index", t_6 + 1);
frame.set("loop.index0", t_6);
frame.set("loop.revindex", t_7.length - t_6);
frame.set("loop.revindex0", t_7.length - t_6 - 1);
frame.set("loop.first", t_6 === 0);
frame.set("loop.last", t_6 === t_7.length - 1);
frame.set("loop.length", t_7.length);
output += runtime.suppressValue("<meta property=\"og:");
output += runtime.suppressValue(runtime.suppressLookupValue((t_8),"property"));
output += runtime.suppressValue("\" content=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((t_8),"content"));
output += runtime.suppressValue("\" />\n");
}
frame = frame.pop();
output += runtime.suppressValue("");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n");
var includeTemplate = env.getTemplate("badge-data.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_head: b_head,
b_body: b_body,
root: root
};

})();
templates["badges.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n\n");
var t_2 = "badges";
frame.set("activeNav", t_2);
if(!frame.parent) {
context.setVariable("activeNav", t_2);
context.addExport("activeNav");
}
output += runtime.suppressValue("\n\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n\n");
output += context.getBlock("scripts")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n\n");
if(!runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "badges")),"length")) {
output += runtime.suppressValue("\n  ");
output += context.getBlock("noBadges")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
}
else {
output += runtime.suppressValue("\n  <input type=\"hidden\" name=\"_csrf\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\">\n  ");
output += context.getBlock("badgeNav")(env, context, frame, runtime);
output += runtime.suppressValue("\n  <div class=\"row\">\n    ");
output += context.getBlock("badgeList")(env, context, frame, runtime);
output += runtime.suppressValue("\n  </div>\n");
}
output += runtime.suppressValue("\n\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_noBadges(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "noBadges", b_noBadges, frame, runtime);
output += runtime.suppressValue("\n    ");
var includeTemplate = env.getTemplate("no-badges.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n  ");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_badgeNav(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "badgeNav", b_badgeNav, frame, runtime);
output += runtime.suppressValue("\n    <p class=\"badge-nav\">\n      <span class=\"hide\">Show</span>\n      <a href=\"/\"");
if(runtime.contextOrFrameLookup(context, frame, "selectedBadgeTab") == "recent") {
output += runtime.suppressValue(" class=\"selected\"");
}
output += runtime.suppressValue(">Recent</a>\n      <span class=\"hide\">,</span>\n      <a href=\"/backpack/badges\"");
if(runtime.contextOrFrameLookup(context, frame, "selectedBadgeTab") == "all") {
output += runtime.suppressValue(" class=\"selected\"");
}
output += runtime.suppressValue(">Everything</a>\n      <span class=\"hide\">or</span>\n      <a href=\"/backpack/add\" class=\"add-openbadge\">Upload</a>\n      <span class=\"hide\">a new badge</span>\n    </p>\n  ");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_badgeList(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "badgeList", b_badgeList, frame, runtime);
output += runtime.suppressValue("\n      <ul id=\"badges\" class=\"js-badges badge-list\">\n        ");
output += context.getBlock("badgeItems")(env, context, frame, runtime);
output += runtime.suppressValue("\n        ");
output += context.getBlock("afterBadgeItems")(env, context, frame, runtime);
output += runtime.suppressValue("\n      </ul>\n    ");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_badgeItems(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "badgeItems", b_badgeItems, frame, runtime);
output += runtime.suppressValue("\n          ");
frame = frame.push();
var t_4 = runtime.contextOrFrameLookup(context, frame, "badges");
for(var t_3=0; t_3 < t_4.length; t_3++) {
var t_5 = t_4[t_3];
frame.set("badge", t_5);
frame.set("loop.index", t_3 + 1);
frame.set("loop.index0", t_3);
frame.set("loop.revindex", t_4.length - t_3);
frame.set("loop.revindex0", t_4.length - t_3 - 1);
frame.set("loop.first", t_3 === 0);
frame.set("loop.last", t_3 === t_4.length - 1);
frame.set("loop.length", t_4.length);
output += runtime.suppressValue("\n            <li class=\"span3 openbadge-container\">\n              <div class=\"openbadge\" data-id=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"id"));
output += runtime.suppressValue("\">\n                <img src=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"imageUrl"));
output += runtime.suppressValue("\" width=\"64\">\n                <p class=\"title\" title=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"body")),"badge")),"name"));
output += runtime.suppressValue("\">");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"body")),"badge")),"name"));
output += runtime.suppressValue("</p>\n                <p class=\"issuer\">Issuer: ");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((t_5),"attributes")),"body")),"badge")),"issuer")),"name"));
output += runtime.suppressValue("</p>\n              </div>\n            </li>\n          ");
}
frame = frame.pop();
output += runtime.suppressValue("\n        ");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_afterBadgeItems(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "afterBadgeItems", b_afterBadgeItems, frame, runtime);
output += runtime.suppressValue("\n          <li class=\"span3\">\n            <a href=\"/backpack/add\" class=\"add-openbadge\">\n              <img src=\"/images/add-badge.png\">\n              <p class=\"title\">Upload a badge</p>\n              <p class=\"issuer\">&nbsp;</p>\n            </a>\n          </li>\n        ");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
output += runtime.suppressValue("\n\n<!-- bootstrap some data -->\n<script>\n  window.badgeData = {};\n  ");
frame = frame.push();
var t_7 = runtime.contextOrFrameLookup(context, frame, "badges");
for(var t_6=0; t_6 < t_7.length; t_6++) {
var t_8 = t_7[t_6];
frame.set("badge", t_8);
frame.set("loop.index", t_6 + 1);
frame.set("loop.index0", t_6);
frame.set("loop.revindex", t_7.length - t_6);
frame.set("loop.revindex0", t_7.length - t_6 - 1);
frame.set("loop.first", t_6 === 0);
frame.set("loop.last", t_6 === t_7.length - 1);
frame.set("loop.length", t_7.length);
output += runtime.suppressValue("\n    window.badgeData[");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_8),"attributes")),"id"));
output += runtime.suppressValue("] = ");
output += runtime.suppressValue(runtime.suppressLookupValue((t_8),"serializedAttributes"));
output += runtime.suppressValue(";\n  ");
}
frame = frame.pop();
output += runtime.suppressValue("\n</script>\n\n<!-- third party -->\n");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "settings")),"env") == "production") {
output += runtime.suppressValue("\n  <script type=\"text/javascript\" src=\"/js/nunjucks-min.js\"></script>\n  <script type=\"text/javascript\" src=\"/js/nunjucks-templates.js\"></script>\n");
}
else {
output += runtime.suppressValue("\n  <script type=\"text/javascript\" src=\"/js/nunjucks-dev.js\"></script>\n");
}
output += runtime.suppressValue("\n<script type=\"text/javascript\" src=\"/js/underscore.js\"></script>\n<script type=\"text/javascript\" src=\"/js/backbone.js\"></script>\n<script type=\"text/javascript\" src=\"/vendor/bootstrap/js/bootstrap-alert.js\"></script>\n<script type=\"text/javascript\" src=\"/vendor/bootstrap/js/bootstrap-tooltip.js\"></script>\n<script type=\"text/javascript\" src=\"/vendor/bootstrap/js/bootstrap-popover.js\"></script>\n\n<!-- my libraries -->\n<script type=\"text/javascript\" src=\"/js/jquery.sync.js\"></script>\n<script type=\"text/javascript\" src=\"/js/backpack.js\"></script>\n\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
b_noBadges: b_noBadges,
b_badgeNav: b_badgeNav,
b_badgeList: b_badgeList,
b_badgeItems: b_badgeItems,
b_afterBadgeItems: b_afterBadgeItems,
b_scripts: b_scripts,
root: root
};

})();
templates["badges_partial.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<span draggable=\"true\" class=\"openbadge\" data-id=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "id"));
output += runtime.suppressValue("\">\n  <img src=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "image_path"));
output += runtime.suppressValue("\" width=\"64px\"/>\n</span>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["baker.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
output += context.getBlock("scripts")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<form id=\"bake-form\" class=\"baker form-stacked\" action=\"/baker\" method=\"GET\">\n  <fieldset>\n    <label for=\"assertion\">URL for your badge assertion</label>\n    <input id=\"assertion\" class=\"xlarge\" type=\"text\" value=\"http://badgehub.org/test/badge.json\" placeholder=\"http://your-site.com/path-to-assertion.json\" name=\"assertion\"></input>\n  </fieldset>\n  <fieldset>\n    <input id=\"submit\" class=\"large btn btn-primary\" type=\"submit\" value=\"Build this badge\"></input>\n  </fieldset>\n</form>\n<div id=\"result\"></div>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
output += runtime.suppressValue("\n<script type=\"text/javascript\" src=\"/js/formatter.js\"></script>\n<script type=\"text/javascript\" src=\"/js/baker.js\"></script>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
b_scripts: b_scripts,
root: root
};

})();
templates["email-converter.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
output += context.getBlock("scripts")(env, context, frame, runtime);
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<div id='converter'>\n  <div class=\"alert alert-error\"></div>\n  <div class=\"alert alert-success\"></div>\n\n  <div class='input'>\n    <input tabindex=1 class='email' type='email' placeholder='something@example.com'>\n    <span class='arrow'>&rarr;</span>\n    <input tabindex=3 class='userid disabled' placeholder=\"12345\">\n  </div>\n  <div class='submit'>\n    <input tabindex=2 type=\"submit\" class=\"btn btn-primary btn-large\" value=\"Let's do this\">\n  </div>\n</div>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
output += runtime.suppressValue("\n<script src='/js/email-converter.js'></script>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
b_scripts: b_scripts,
root: root
};

})();
templates["error.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "status"));
output += runtime.suppressValue(" :: ");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "message"));
output += runtime.suppressValue("\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["errors/404.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n\n");
output += context.getBlock("body")(env, context, frame, runtime);
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<div class=\"hero-unit\">\n  <h1>Page Not Found</h1>\n  <p>Unfortunately the page you're looking for doesn't appear to exist.</p>\n  <p><strong>This might be because:</strong></p>\n  <ul>\n    <li>The page may have been moved, updated or deleted</li>\n    <li>If you clicked on a link, it may be out of date... or just wrong!</li>\n    <li>There might be typing error in the web address</li>\n  </ul>\n  <p><a href=\"/\" class=\"btn btn-large\">Go Home</a></p>\n</div>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
root: root
};

})();
templates["group-template.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<div class='group ");
if(!runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "attributes")),"id")) {
output += runtime.suppressValue("isNew");
}
output += runtime.suppressValue("'>\n  <input class='groupName' type='text' value='");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "name"));
output += runtime.suppressValue("'>\n  <span class='icon delete'>&times;</span>\n  <span class='icon share' title='share this group'>5</span>\n  \n  ");
if(!runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "attributes")),"id")) {
output += runtime.suppressValue("\n    <hgroup class=\"instructions\">\n      <h3>Drag a badge here</h3>\n      to create a Collection.\n    </hgroup>\n  ");
}
output += runtime.suppressValue("\n\n  <span class='public'>\n    <label>\n      <input type='checkbox' class='js-privacy' ");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "attributes")),"public")) {
output += runtime.suppressValue("checked");
}
output += runtime.suppressValue(">\n      <span>public</span>\n    </label>\n  </span>\n</div>");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["issuer-welcome.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<div class=\"row\" style=\"position: relative;\">\n  <div class=\"span4 column\">\n    <h1>Badges</h1>\n    <div id=\"badges\">\n      <span class=\"openbadge\">\n        <img src=\"/images/ghost-badge.png\" width=\"64px\"/>\n      </span>\n    </div>\n  </div>\n  <div class=\"span8 column\">\n    <h1>Welcome to your Open Badge Backpack!</h1>\n    <h2>So glad you could join us.</h2>\n\n    <p>\n      You're almost finished accepting your first badge! You've created\n      your backpack, now return to the window where you earned your\n      badge and accept it. Then when you come back here and refresh the\n      page, you'll see it on the left.\n    </p>\n  </div>\n</div>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["issuer.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<form action=\"/demo/award\" method=\"post\">\n  <input type=\"hidden\" name=\"_csrf\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\">\n  <fieldset>\n    <div class=\"clearfix\">\n      <label for=\"recp\">Recipient</label>\n      <div class=\"input\">\n        <input id=\"recp\" type=\"text\" name=\"recipient\"></input>\n      </div>\n    </div>\n\n    <div class=\"clearfix\">\n      <label for=\"image\">Image Url</label>\n      <div class=\"input\">\n        <input id=\"image\" type=\"text\" name=\"image\"></input>\n      </div>\n    </div>\n\n    <div class=\"input\">\n      <input class=\"btn btn-primary\" type=\"submit\" value=\"Award badge\"></input>\n    </div>\n\n  </fieldset>\n</form>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
root: root
};

})();
templates["layout.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<!DOCTYPE html>\n<html");
output += runtime.suppressValue(env.getFilter("default")(runtime.contextOrFrameLookup(context, frame, "htmlPrefix"),""));
output += runtime.suppressValue(">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge;chrome=1\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <link rel=\"icon\" href=\"/favicon.ico\">\n    <link href=\"//www.mozilla.org/tabzilla/media/css/tabzilla.css\" rel=\"stylesheet\" />\n    <link rel=\"stylesheet\" href=\"/css/backpack.min.css\" type=\"text/css\" media=\"all\" />\n    <title dir=\"ltr\">Open Badge Backpack</title>\n    <script type=\"text/javascript\" src=\"/js/modernizr.js\"></script>\n    <script type=\"text/javascript\" src=\"https://login.persona.org/include.js\"></script>\n    <script type=\"text/javascript\" src=\"/js/jquery.min.js\"></script>\n    <script type=\"text/javascript\">\n      var _gaq = _gaq || [];\n      _gaq.push(['_setAccount', 'UA-35433268-10']);\n      _gaq.push(['_setDomainName', 'openbadges.org']);\n      _gaq.push(['_trackPageview']);\n      (function() {\n        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;\n        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';\n        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);\n      })();\n    </script>\n    ");
output += context.getBlock("head")(env, context, frame, runtime);
output += runtime.suppressValue("\n  </head>\n  <body ");
if(runtime.contextOrFrameLookup(context, frame, "bodyClass")) {
output += runtime.suppressValue("class=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "bodyClass"));
output += runtime.suppressValue("\"");
}
output += runtime.suppressValue(">\n    <div id=\"fb-root\"></div>\n    ");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "settings")),"env") == "development") {
output += runtime.suppressValue("\n      <img src=\"/images/testribbon.png\" class=\"test-ribbon\" title=\"");
output += runtime.suppressValue(env.getFilter("d")(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "settings")),"sha"),""));
output += runtime.suppressValue("\">\n    ");
}
output += runtime.suppressValue("\n    <div class=\"navbar\">\n      <div class=\"navbar-inner\">\n        <div class=\"container\" style=\"position: relative;\">\n          <a class=\"brand\" href=\"/\">\n            <img src=\"/images/logo.png\" alt=\"Mozilla Backpack logo\" />\n          </a>\n          <a href=\"http://www.mozilla.org/\" id=\"tabzilla\">a mozilla.org joint</a>\n          <ul class=\"nav pull-right\">\n          ");
if(runtime.contextOrFrameLookup(context, frame, "user")) {
output += runtime.suppressValue("\n            <li ");
if(runtime.contextOrFrameLookup(context, frame, "activeNav") == "badges") {
output += runtime.suppressValue("class=\"active\"");
}
output += runtime.suppressValue(">\n              <a href=\"/\" class=\"icon badge-link\"><span>Badges</span></a>\n            </li>\n            <li ");
if(runtime.contextOrFrameLookup(context, frame, "activeNav") == "collections") {
output += runtime.suppressValue("class=\"active\"");
}
output += runtime.suppressValue(">\n              <a href=\"/backpack\" class=\"icon collection-link\"><span>Collections</span></a>\n            </li>\n            <li class=\"user navbar-text\">");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "user")),"attributes")),"email"));
output += runtime.suppressValue("</li>\n            <li class=\"dropdown\">\n              <a href=\"#\" class=\"icon gear-link dropdown-toggle\" data-toggle=\"dropdown\">\n                <span><b class=\"caret\"></b></span>\n              </a>\n              <ul class=\"dropdown-menu\">\n                <li><a href=\"/backpack/settings\">Settings</a></li>\n                <li><a href=\"/backpack/signout\">Sign Out</a></li>\n              </ul>\n            </li>\n          ");
}
else {
if(runtime.contextOrFrameLookup(context, frame, "bodyClass") == "login") {
output += runtime.suppressValue("\n            <li><a class=\"js-browserid-link\" href=\"#\">Log In</a></li>\n          ");
}
}
output += runtime.suppressValue("\n          </ul>\n        </div>\n      </div>\n    </div>\n\n    <div id=\"body\" class=\"container\">\n      <div class='message-container'>\n      ");
frame = frame.push();
var t_2 = runtime.contextOrFrameLookup(context, frame, "error");
for(var t_1=0; t_1 < t_2.length; t_1++) {
var t_3 = t_2[t_1];
frame.set("e", t_3);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2.length - t_1);
frame.set("loop.revindex0", t_2.length - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2.length - 1);
frame.set("loop.length", t_2.length);
output += runtime.suppressValue("\n        <div class=\"alert alert-error\">\n          <a class=\"close\" data-dismiss=\"alert\">×</a>\n          ");
output += runtime.suppressValue(t_3);
output += runtime.suppressValue("\n        </div>\n      ");
}
frame = frame.pop();
output += runtime.suppressValue("\n\n      ");
frame = frame.push();
var t_5 = runtime.contextOrFrameLookup(context, frame, "success");
for(var t_4=0; t_4 < t_5.length; t_4++) {
var t_6 = t_5[t_4];
frame.set("s", t_6);
frame.set("loop.index", t_4 + 1);
frame.set("loop.index0", t_4);
frame.set("loop.revindex", t_5.length - t_4);
frame.set("loop.revindex0", t_5.length - t_4 - 1);
frame.set("loop.first", t_4 === 0);
frame.set("loop.last", t_4 === t_5.length - 1);
frame.set("loop.length", t_5.length);
output += runtime.suppressValue("\n        <div class=\"alert alert-success\">\n          <a class=\"close\" data-dismiss=\"alert\">×</a>\n          ");
output += runtime.suppressValue(t_6);
output += runtime.suppressValue("\n        </div>\n      ");
}
frame = frame.pop();
output += runtime.suppressValue("\n      </div>\n\n      ");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n    </div>\n\n    <div id=\"footer\" class=\"container\">\n      <aside><small>\n        <h2>Legal</h2>\n        <ul>\n          <li><a href=\"/tou.html\" class=\"muted\">Terms of Use</a></li>\n          <li><a href=\"/privacy.html\" class=\"muted\">Privacy Policy</a></li>\n          <li><a href=\"/vpat.html\" class=\"muted\">Accessibility</a></li>\n        </ul>\n      </small></aside>\n    </div>\n\n    <script src=\"//www.mozilla.org/tabzilla/media/js/tabzilla.js\"></script>\n    <script type=\"text/javascript\" src=\"/vendor/bootstrap/js/bootstrap-dropdown.js\"></script>\n    ");
output += context.getBlock("scripts")(env, context, frame, runtime);
output += runtime.suppressValue("\n\n  </body>\n</html>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_head(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "head", b_head, frame, runtime);
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_head: b_head,
b_body: b_body,
b_scripts: b_scripts,
root: root
};

})();
templates["login.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
var t_2 = "login";
frame.set("bodyClass", t_2);
if(!frame.parent) {
context.setVariable("bodyClass", t_2);
context.addExport("bodyClass");
}
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<h1 class=\"title\">Welcome to your Backpack</h1>\n<p class=\"subtitle\">Celebrate your skills & passions</p>\n<a class=\"persona-button dark big js-browserid-link\" href=\"#\"><span>Log In or Sign Up</span></a>\n\n<form class=\"signin js-browserid-form\" method=\"POST\" action=\"/backpack/authenticate\">\n  <input class=\"js-browserid-input\" name=\"assertion\" type=\"hidden\"></input>\n  <input name=\"_csrf\" type=\"hidden\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\"></input>\n</form>\n\n\n<script type=\"text/javascript\">\n!!function loginHandler () {\n//begin login handler\n\n  function launchBrowserId(callback) {\n    return function() { navigator.id.get(callback, {\n      siteName: 'Open Badge Backpack',\n      termsOfService: '/tou.html',\n      privacyPolicy: '/privacy.html',\n      returnTo: '/'\n    }); }\n  }\n  function handleResponse(assertion) {\n    if (!assertion) return false;\n    $('.js-browserid-input').val(assertion);\n    $('.js-browserid-form').trigger('submit');\n  }\n  $('.js-browserid-link').bind('click', launchBrowserId(handleResponse));\n\n//begin login handler scope\n}();\n</script>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
root: root
};

})();
templates["no-badges.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<h1>It's time to start earning open badges!</h1>\n<p>You might explore <a href=\"http://badges.webmaker.org\">Webmaker Badges</a> as well as thousands of <a href=\"https://wiki.mozilla.org/Badges/Issuers\">other offerings from  badge issuers.</a></p>\n<p>You can also manually upload any of the open badges you've earned.</p>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["permissions.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<ul>\n  ");
frame = frame.push();
var t_2 = runtime.contextOrFrameLookup(context, frame, "permissions");
for(var t_1=0; t_1 < t_2.length; t_1++) {
var t_3 = t_2[t_1];
frame.set("permission", t_3);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2.length - t_1);
frame.set("loop.revindex0", t_2.length - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2.length - 1);
frame.set("loop.length", t_2.length);
output += runtime.suppressValue("\n    <li>\n      ");
if(t_3 == "issue") {
output += runtime.suppressValue("\n      Send the open badges I've earned to my Mozilla Backpack.\n      ");
}
output += runtime.suppressValue("\n    </li>\n  ");
}
frame = frame.pop();
output += runtime.suppressValue("\n</ul>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["portfolio-editor.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
output += context.getBlock("scripts")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<form class='portfolio' action='/share/");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"group")),"attributes")),"url"));
output += runtime.suppressValue("/' method='post'>\n  <input type='hidden' name='_csrf' value='");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("'>\n  <input type='hidden' name='id' value='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"attributes")),"id"));
output += runtime.suppressValue("'>\n  <input type='hidden' name='group_id' value='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "group")),"attributes")),"id"));
output += runtime.suppressValue("'>\n  <input type='hidden' name='url' value='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "groups")),"attributes")),"url"));
output += runtime.suppressValue("'>\n  <header>\n    <input tabindex=1 name='title' class='field title' value='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"attributes")),"title"));
output += runtime.suppressValue("'>\n    <input tabindex=1 name='subtitle' class='field subtitle' placeholder='Optional subtitle' value='");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"attributes")),"subtitle"));
output += runtime.suppressValue("'>\n  </header>\n\n  <ul class='badges'>\n    ");
frame = frame.push();
var t_3 = runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"badges");
for(var t_2=0; t_2 < t_3.length; t_2++) {
var t_4 = t_3[t_2];
frame.set("badge", t_4);
frame.set("loop.index", t_2 + 1);
frame.set("loop.index0", t_2);
frame.set("loop.revindex", t_3.length - t_2);
frame.set("loop.revindex0", t_3.length - t_2 - 1);
frame.set("loop.first", t_2 === 0);
frame.set("loop.last", t_2 === t_3.length - 1);
frame.set("loop.length", t_3.length);
output += runtime.suppressValue("\n      <li>\n        <h3>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((t_4),"attributes")),"body")),"badge")),"name"));
output += runtime.suppressValue("</h3>\n\n        <textarea name='stories[");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_4),"attributes")),"id"));
output += runtime.suppressValue("]' tabindex=1 class='story' placeholder='some information about this badge'>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_4),"attributes")),"_userStory"));
output += runtime.suppressValue("</textarea>\n\n        ");
var includeTemplate = env.getTemplate("badge-data.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n      </li>\n    ");
}
frame = frame.pop();
output += runtime.suppressValue("\n  </ul>\n  \n  <div class='save actions'>\n    <input tabindex=1 class='btn btn-primary btn-large save' type='submit' value='Save this page'>\n  </div>\n\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
output += runtime.suppressValue("\n\n  <script>\n    $('form.portfolio').on('submit', function(e){\n      e.preventDefault();\n      return false;\n    });\n    $('input.save').on('click', function(e){\n      $('form.portfolio')[0].submit();\n    })\n  </script>\n</form>\n\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
b_scripts: b_scripts,
root: root
};

})();
templates["portfolio.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
output += context.getBlock("scripts")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<link rel=\"stylesheet\" href=\"/css/socialmedia.css\">\n\n<div class='portfolio'>\n");
if(runtime.contextOrFrameLookup(context, frame, "owner")) {
output += runtime.suppressValue("\n  <div class=\"alert alert-info\">\n    <div class=\"socialshare\" style=\"float: left;\" tabindex=\"0\" onclick=\"injectSocialMedia(this)\">\n      <span class=\"msg\">Share this on twitter, google+ or facebook</span>\n      <div class=\"social-medium twitter\"></div>\n      <div class=\"social-medium google\"></div>\n      <div class=\"social-medium facebook\"></div>\n    </div>\n    <a href=\"edit\" class='edit btn btn-primary'>Edit this page</a>\n    <strong class=\"shareMessage\">This is how your portfolio page will look to the public.</strong>\n  </div>\n");
}
output += runtime.suppressValue("\n\n  <header>\n    ");
if(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"attributes")),"title")) {
output += runtime.suppressValue("\n      <h1>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"attributes")),"title"));
output += runtime.suppressValue("</h1>\n    ");
}
output += runtime.suppressValue("\n    ");
if(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"attributes")),"subtitle")) {
output += runtime.suppressValue("\n      <h2>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"attributes")),"subtitle"));
output += runtime.suppressValue("</h1>\n    ");
}
output += runtime.suppressValue("\n  </header>\n\n  <ul class='badges'>\n    ");
frame = frame.push();
var t_3 = runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "portfolio")),"badges");
for(var t_2=0; t_2 < t_3.length; t_2++) {
var t_4 = t_3[t_2];
frame.set("badge", t_4);
frame.set("loop.index", t_2 + 1);
frame.set("loop.index0", t_2);
frame.set("loop.revindex", t_3.length - t_2);
frame.set("loop.revindex0", t_3.length - t_2 - 1);
frame.set("loop.first", t_2 === 0);
frame.set("loop.last", t_2 === t_3.length - 1);
frame.set("loop.length", t_3.length);
output += runtime.suppressValue("\n      <li>\n        <h3>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.suppressLookupValue((t_4),"attributes")),"body")),"badge")),"name"));
output += runtime.suppressValue("</h3>\n\n        <p class='story'>");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.suppressLookupValue((t_4),"attributes")),"_userStory"));
output += runtime.suppressValue("</p>\n\n        ");
var includeTemplate = env.getTemplate("badge-data.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n      </li>\n    ");
}
frame = frame.pop();
output += runtime.suppressValue("\n  </ul>\n\n  ");
if(runtime.contextOrFrameLookup(context, frame, "postamble")) {
output += runtime.suppressValue("\n  <section class='postamble'>\n    ");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "postamble"));
output += runtime.suppressValue("\n  </section>\n  ");
}
output += runtime.suppressValue("\n</div>\n\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
output += runtime.suppressValue("\n<script type=\"text/javascript\" src=\"/vendor/bootstrap/js/bootstrap-alert.js\"></script>\n<script type=\"text/javascript\" src=\"/js/social-media.js\"></script>\n\n<script>\nfunction injectSocialMedia(container) {\n  // prevent this element from injecting social media again\n  container.onclick = function() { return false; }\n  var socialMedia = new SocialMedia();\n  var url = window.location.toString();\n\n  // inject twitter, g+ and facebook\n  socialMedia.hotLoad(container.querySelector(\".twitter\"),  socialMedia.twitter,  url);\n  socialMedia.hotLoad(container.querySelector(\".google\"),   socialMedia.google,   url);\n  socialMedia.hotLoad(container.querySelector(\".facebook\"), socialMedia.facebook, url);\n\n  // kill off the text label\n  var label = container.querySelector(\"span\");\n  $(label).remove();\n}\n</script>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
b_scripts: b_scripts,
root: root
};

})();
templates["recentBadges.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("badges.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n\n");
var t_2 = "recent";
frame.set("selectedBadgeTab", t_2);
if(!frame.parent) {
context.setVariable("selectedBadgeTab", t_2);
context.addExport("selectedBadgeTab");
}
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["settings.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n\n");
output += context.getBlock("scripts")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<h1>Backpack Settings</h1>\n<form method=\"post\" class=\"settings\">\n  <input type=\"hidden\" name=\"_csrf\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("\">\n\n  <!-- TODO: Re-enable this when sharing actually works well.\n\n  <fieldset id=\"accounts\">\n    <legend>Connected Accounts</legend>\n    <div class=\"item\">\n      <span class=\"title\"><strong>Twitter</strong>\n        ");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "services")),"twitter")) {
output += runtime.suppressValue(" <span class=\"hide\">is</span> <span class=\"status\">connected</span>");
}
output += runtime.suppressValue("\n      </span>\n      <div class=\"content\">\n        Please note that badges you share on Twitter will be public\n        ");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "services")),"twitter")) {
output += runtime.suppressValue("\n          <input type=\"button\" class=\"btn btn-danger\" value=\"Disconnect\">\n        ");
}
else {
output += runtime.suppressValue("\n          <input type=\"button\" class=\"btn btn-primary\" value=\"Connect\">\n        ");
}
output += runtime.suppressValue("\n      </div>\n    </div>\n    <div class=\"item\">\n      <span class=\"title\"><strong>Facebook</strong>\n        ");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "services")),"facebook")) {
output += runtime.suppressValue(" <span class=\"hide\">is</span> <span class=\"status\">connected</span>");
}
output += runtime.suppressValue("\n      </span>\n      ");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "services")),"facebook")) {
output += runtime.suppressValue("\n        <div class=\"content\">\n          <input type=\"button\" class=\"btn btn-danger\" value=\"Disconnect\">\n        </div>\n        <div class=\"secondary\">\n          <label class=\"slider full\">\n            Automatically post to my wall when I earn new badges\n            <input type=\"checkbox\" id=\"services-facebook-auto\" name=\"services[facebook][auto]\" value=\"true\"");
if(runtime.suppressLookupValue((runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "services")),"facebook")),"auto")) {
output += runtime.suppressValue(" checked=\"checked\"");
}
output += runtime.suppressValue(">\n            <span data-on=\"On\" data-off=\"Off\"></span>\n          </label>\n        </div>\n      ");
}
else {
output += runtime.suppressValue("\n        <div class=\"content\">\n          <input type=\"button\" class=\"btn btn-primary\" value=\"Connect\">\n        </div>\n      ");
}
output += runtime.suppressValue("\n    </div>\n  </fieldset>\n\n  -->\n  <fieldset id=\"issuer-acceptance\">\n    <legend>Connected Issuers</legend>\n    ");
if(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "issuers")),"length")) {
output += runtime.suppressValue("\n      ");
frame = frame.push();
var t_3 = runtime.contextOrFrameLookup(context, frame, "issuers");
for(var t_2=0; t_2 < t_3.length; t_2++) {
var t_4 = t_3[t_2];
frame.set("issuer", t_4);
frame.set("loop.index", t_2 + 1);
frame.set("loop.index0", t_2);
frame.set("loop.revindex", t_3.length - t_2);
frame.set("loop.revindex0", t_3.length - t_2 - 1);
frame.set("loop.first", t_2 === 0);
frame.set("loop.last", t_2 === t_3.length - 1);
frame.set("loop.length", t_3.length);
output += runtime.suppressValue("\n        <div class=\"item\">\n          <span class=\"title\">\n            <strong>");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"domain"));
output += runtime.suppressValue("</strong>\n            <small>\n              <p>The website at \n                <a href=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"origin"));
output += runtime.suppressValue("\">");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"domain"));
output += runtime.suppressValue("</a> has\n                permission to:</p>\n              ");
var t_5 = runtime.suppressLookupValue((t_4),"permissions");
frame.set("permissions", t_5);
if(!frame.parent) {
context.setVariable("permissions", t_5);
context.addExport("permissions");
}
output += runtime.suppressValue("\n              ");
var includeTemplate = env.getTemplate("permissions.html");
output += includeTemplate.render(context.getVariables(), frame.push());
output += runtime.suppressValue("\n            </small>\n          </span>\n          <div class=\"content\">\n            <button type=\"button\" class=\"btn btn-danger js-revoke\"\n                    autocomplete=\"off\"\n                    data-loading-text=\"Revoking...\"\n                    data-revoke=\"");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"origin"));
output += runtime.suppressValue("\">Revoke\n              access for ");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"domain"));
output += runtime.suppressValue("</button>\n          </div>\n        </div>\n      ");
}
frame = frame.pop();
output += runtime.suppressValue("\n    ");
}
else {
output += runtime.suppressValue("\n      <div class=\"item\">\n        No issuers found.\n      </div>\n    ");
}
output += runtime.suppressValue("\n  </fieldset>\n</form>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_scripts(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "scripts", b_scripts, frame, runtime);
output += runtime.suppressValue("\n<script src=\"/vendor/bootstrap/js/bootstrap-button.js\"></script>\n<script>\nvar CONFIRM_MSG = \"Are you sure you want to prevent the website at \" +\n                  \"ORIGIN from accessing your backpack?\";\n\n$(window).ready(function() {\n  $(\".js-revoke\").click(function() {\n    var item = $(this).closest(\".item\");\n    var origin = $(this).attr(\"data-revoke\");\n    var confirmMsg = CONFIRM_MSG.replace(/ORIGIN/g, origin);\n\n    if (!window.confirm(confirmMsg)) return false;\n    $(this).button('loading');\n    $.post('/backpack/settings/revoke-origin', {\n      _csrf: '");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("',\n      origin: origin\n    }, function() { item.slideUp(); });\n    return false;\n  });\n});\n</script>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
b_scripts: b_scripts,
root: root
};

})();
templates["stats.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<h1>Backpack Facts</h1>\n\n<p>\n  There are ");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "totalBadges"));
output += runtime.suppressValue(" badges in the system\n  from ");
output += runtime.suppressValue(runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "totalPerIssuer")),"length"));
output += runtime.suppressValue(" issuers, and\n  ");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "userCount"));
output += runtime.suppressValue(" users.\n</p>\n<p>Some details per issuer,\n  <ul>\n    ");
frame = frame.push();
var t_3 = runtime.contextOrFrameLookup(context, frame, "totalPerIssuer");
for(var t_2=0; t_2 < t_3.length; t_2++) {
var t_4 = t_3[t_2];
frame.set("total", t_4);
frame.set("loop.index", t_2 + 1);
frame.set("loop.index0", t_2);
frame.set("loop.revindex", t_3.length - t_2);
frame.set("loop.revindex0", t_3.length - t_2 - 1);
frame.set("loop.first", t_2 === 0);
frame.set("loop.last", t_2 === t_3.length - 1);
frame.set("loop.length", t_3.length);
output += runtime.suppressValue("\n    <li>");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"name"));
output += runtime.suppressValue(" (<a href='");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"url"));
output += runtime.suppressValue("'>");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"url"));
output += runtime.suppressValue("</a>) has ");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"total"));
output += runtime.suppressValue(" badges</li>\n    ");
}
frame = frame.pop();
output += runtime.suppressValue("\n  </ul>\n</p>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
root: root
};

})();
templates["validator.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = env.getTemplate("layout.html", true);
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += runtime.suppressValue("\n");
output += context.getBlock("body")(env, context, frame, runtime);
output += runtime.suppressValue("\n");
return parentTemplate.rootRenderFunc(env, context, frame, runtime);
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
function b_body(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var l_super = context.getSuper(env, "body", b_body, frame, runtime);
output += runtime.suppressValue("\n<div id='validator'>\n  <form action='' method='post'>\n    <input type='hidden' name='_csrf' value='");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "csrfToken"));
output += runtime.suppressValue("'>\n    <textarea placeholder='Paste in your assertion here' name='assertion'>");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assertion"));
output += runtime.suppressValue("</textarea>\n    <div class='submit'>\n      <input type='submit' class='primary large btn' value='Check your assertion'>\n    </div>\n  </form>\n\n  <div id='results'>\n    ");
if(runtime.contextOrFrameLookup(context, frame, "submitted")) {
output += runtime.suppressValue("\n      ");
if(runtime.contextOrFrameLookup(context, frame, "success")) {
output += runtime.suppressValue("\n        <h2>Everything looks good!</h2>\n      ");
}
else {
output += runtime.suppressValue("\n        <h2>There were problems with the following fields:</h2>\n        <ul>\n          ");
frame = frame.push();
var t_3 = runtime.contextOrFrameLookup(context, frame, "errors");
for(var t_2=0; t_2 < t_3.length; t_2++) {
var t_4 = t_3[t_2];
frame.set("error", t_4);
frame.set("loop.index", t_2 + 1);
frame.set("loop.index0", t_2);
frame.set("loop.revindex", t_3.length - t_2);
frame.set("loop.revindex0", t_3.length - t_2 - 1);
frame.set("loop.first", t_2 === 0);
frame.set("loop.last", t_2 === t_3.length - 1);
frame.set("loop.length", t_3.length);
output += runtime.suppressValue("\n            <li><strong>");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"field"));
output += runtime.suppressValue("</strong>: ");
output += runtime.suppressValue(runtime.suppressLookupValue((t_4),"value"));
output += runtime.suppressValue("</li>\n          ");
}
frame = frame.pop();
output += runtime.suppressValue("\n        </ul>\n      ");
}
output += runtime.suppressValue("\n\n    ");
}
output += runtime.suppressValue("\n  </div>\n</div>\n");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
b_body: b_body,
root: root
};

})();
nunjucks.env = new nunjucks.Environment([]);
nunjucks.env.registerPrecompiled(templates);
})()
