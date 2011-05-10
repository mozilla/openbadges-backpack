!!function(window){
  // bail if already defined
  // BUG: in FF4, navigator objects will remain defined between page refreshes
  /* if (typeof navigator.badges === "object") { return; } */
  
  var ORIGIN = "http://backpack.local",
      ENDPOINT = ORIGIN + "/include/channel.html",
      badgeAPI = navigator.badges = {};
  
  // minified jschannel - https://github.com/mozilla/jschannel
  var Channel=function(){function y(a,e,j,i){function f(e){for(var d=0;d<e.length;d++)if(e[d].win===a)return!0;return!1}var g=!1;if(e==="*")for(var k in d){if(d.hasOwnProperty(k)&&k!=="*"&&typeof d[k][j]==="object"&&(g=f(d[k][j])))break}else d["*"]&&d["*"][j]&&(g=f(d["*"][j])),!g&&d[e]&&d[e][j]&&(g=f(d[e][j]));if(g)throw"A channel is already bound to the same window which overlaps with origin '"+e+"' and has scope '"+j+"'";typeof d[e]!="object"&&(d[e]={});typeof d[e][j]!="object"&&(d[e][j]=[]);d[e][j].push({win:a, handler:i})}function x(a){return Array.isArray?Array.isArray(a):a.constructor.toString().indexOf("Array")!=-1}var q=Math.floor(Math.random()*1000001),d={},r={},s=function(a){var e=JSON.parse(a.data);if(typeof e==="object"){var j=a.source,a=a.origin,i=null,f=null,g=null;if(typeof e.method==="string")g=e.method.split("::"),g.length==2?(i=g[0],g=g[1]):g=e.method;if(typeof e.id!=="undefined")f=e.id;if(typeof g==="string"){var k=!1;if(d[a]&&d[a][i])for(f=0;f<d[a][i].length;f++)if(d[a][i][f].win===j){d[a][i][f].handler(a, g,e);k=!0;break}if(!k&&d["*"]&&d["*"][i])for(f=0;f<d["*"][i].length;f++)if(d["*"][i][f].win===j){d["*"][i][f].handler(a,g,e);break}}else if(typeof f!="undefined"&&r[f])r[f](a,g,e)}};window.addEventListener?window.addEventListener("message",s,!1):window.attachEvent&&window.attachEvent("onmessage",s);return{build:function(a){var e=function(b){if(a.debugOutput&&window.console&&window.console.log){try{typeof b!=="string"&&(b=JSON.stringify(b))}catch(h){}console.log("["+f+"] "+b)}};if(!window.postMessage)throw"jschannel cannot run this browser, no postMessage"; if(!window.JSON||!window.JSON.stringify||!window.JSON.parse)throw"jschannel cannot run this browser, no JSON parsing/serialization";if(typeof a!="object")throw"Channel build invoked without a proper object argument";if(!a.window||!a.window.postMessage)throw"Channel.build() called without a valid window argument";if(window===a.window)throw"target window is same as present window -- not allowed";var j=!1;if(typeof a.origin==="string"){var i;if(a.origin==="*")j=!0;else if(null!==(i=a.origin.match(/^https?:\/\/(?:[-a-zA-Z0-9\.])+(?::\d+)?/)))a.origin= i[0],j=!0}if(!j)throw"Channel.build() called with an invalid origin";if(typeof a.scope!=="undefined"){if(typeof a.scope!=="string")throw"scope, when specified, must be a string";if(a.scope.split("::").length>1)throw"scope may not contain double colons: '::'";}var f=function(){for(var b="",a=0;a<5;a++)b+="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random()*62));return b}(),g={},k={},o={},n=!1,t=[],s=function(b,a,c){var e=!1,d=!1;return{origin:a,invoke:function(a, d){if(!o[b])throw"attempting to invoke a callback of a nonexistent transaction: "+b;for(var e=!1,h=0;h<c.length;h++)if(a===c[h]){e=!0;break}if(!e)throw"request supports no such callback '"+a+"'";m({id:b,callback:a,params:d})},error:function(a,c){d=!0;if(!o[b])throw"error called for nonexistent message: "+b;delete o[b];m({id:b,error:a,message:c})},complete:function(a){d=!0;if(!o[b])throw"complete called for nonexistent message: "+b;delete o[b];m({id:b,result:a})},delayReturn:function(b){typeof b=== "boolean"&&(e=b===!0);return e},completed:function(){return d}}},v=function(b,h,c){if(typeof a.gotMessageObserver==="function")try{a.gotMessageObserver(b,c)}catch(d){e("gotMessageObserver() raised an exception: "+d.toString())}if(c.id&&h){if(g[h]){var f=s(c.id,b,c.callbacks?c.callbacks:[]);o[c.id]={};try{if(c.callbacks&&x(c.callbacks)&&c.callbacks.length>0)for(b=0;b<c.callbacks.length;b++){for(var j=c.callbacks[b],i=c.params,u=j.split("/"),m=0;m<u.length-1;m++){var n=u[m];typeof i[n]!=="object"&& (i[n]={});i=i[n]}i[u[u.length-1]]=function(){var b=j;return function(a){return f.invoke(b,a)}}()}var p=g[h](f,c.params);!f.delayReturn()&&!f.completed()&&f.complete(p)}catch(l){c="runtime_error";h=null;if(typeof l==="string")h=l;else if(typeof l==="object")if(l&&x(l)&&l.length==2)c=l[0],h=l[1];else if(typeof l.error==="string")c=l.error,l.message?typeof l.message==="string"?h=l.message:l=l.message:h="";if(h===null)try{h=JSON.stringify(l)}catch(q){h=l.toString()}f.error(c,h)}}}else if(c.id&&c.callback)if(!k[c.id]|| !k[c.id].callbacks||!k[c.id].callbacks[c.callback])e("ignoring invalid callback, id:"+c.id+" ("+c.callback+")");else k[c.id].callbacks[c.callback](c.params);else if(c.id)if(k[c.id]){if(c.error){h=k[c.id].error;if(typeof h!=="function")throw"Error: Call to method '"+c.message+"' failed and no error handler was provided.";h(c.error,c.message)}else c.result!==void 0?(0,k[c.id].success)(c.result):(0,k[c.id].success)();delete k[c.id];delete r[c.id]}else e("ignoring invalid response: "+c.id);else if(h&& g[h])g[h](null,c.params)};y(a.window,a.origin,typeof a.scope==="string"?a.scope:"",v);var w=function(b){typeof a.scope==="string"&&a.scope.length&&(b=[a.scope,b].join("::"));return b},m=function(b,d){if(!b)throw"postMessage called with null message";e((n?"post ":"queue ")+" message: "+JSON.stringify(b));if(!d&&!n)t.push(b);else{if(typeof a.postMessageObserver==="function")try{a.postMessageObserver(a.origin,b)}catch(c){e("postMessageObserver() raised an exception: "+c.toString())}a.window.postMessage(JSON.stringify(b), a.origin)}},p={unbind:function(b){if(g[b]){if(!delete g[b])throw"can't delete method: "+b;return!0}return!1},bind:function(b,a){if(!b||typeof b!=="string")throw"'method' argument to bind must be string";if(!a||typeof a!=="function")throw"callback missing from bind params";if(g[b])throw"method '"+b+"' is already bound!";g[b]=a},call:function(a){if(!a)throw"missing arguments to call function";if(!a.method||typeof a.method!=="string")throw"'method' argument to call must be string";if(!a.success||typeof a.success!== "function")throw"'success' callback missing from call";var d={},c=[],e=function(a,b){if(typeof b==="object")for(var f in b)if(b.hasOwnProperty(f)){var g=a+(a.length?"/":"")+f;typeof b[f]==="function"?(d[g]=b[f],c.push(g),delete b[f]):typeof b[f]==="object"&&e(g,b[f])}};e("",a.params);var f={id:q,method:w(a.method),params:a.params};if(c.length)f.callbacks=c;k[q]={callbacks:d,error:a.error,success:a.success};r[q]=v;q++;m(f)},notify:function(a){if(!a)throw"missing arguments to notify function";if(!a.method|| typeof a.method!=="string")throw"'method' argument to notify must be string";m({method:w(a.method),params:a.params})},destroy:function(){for(var b=a.window,h=a.origin,c=typeof a.scope==="string"?a.scope:"",j=d[h][c],i=0;i<j.length;i++)j[i].win===b&&j.splice(i,1);d[h][c].length===0&&delete d[h][c];window.removeEventListener?window.removeEventListener("message",v,!1):window.detachEvent&&window.detachEvent("onmessage",v);n=!1;g={};o={};k={};a.origin=null;t=[];e("channel destroyed");f=""}};p.bind("__ready", function(b,d){e("ready msg received");if(n)throw"received ready message while in ready state. help!";f+=d==="ping"?"-R":"-L";p.unbind("__ready");n=!0;e("ready msg accepted.");for(d==="ping"&&p.notify({method:"__ready",params:"pong"});t.length;)m(t.pop());if(typeof a.onReady==="function")a.onReady(p)});setTimeout(function(){m({method:w("__ready"),params:"ping"},!0)},0);return p}}}();
  // minified DomReady - http://code.google.com/p/domready/
  (function(){function e(){if(!d&&(d=!0,c)){for(var a=0;a<c.length;a++)c[a].call(window,[]);c=[]}}function j(a){var g=window.onload;window.onload=typeof window.onload!="function"?a:function(){g&&g();a()}}function h(){if(!i){i=!0;document.addEventListener&&!f.opera&&document.addEventListener("DOMContentLoaded",e,!1);f.msie&&window==top&&function(){if(!d){try{document.documentElement.doScroll("left")}catch(a){setTimeout(arguments.callee,0);return}e()}}();f.opera&&document.addEventListener("DOMContentLoaded", function(){if(!d){for(var a=0;a<document.styleSheets.length;a++)if(document.styleSheets[a].disabled){setTimeout(arguments.callee,0);return}e()}},!1);if(f.safari){var a;(function(){if(!d)if(document.readyState!="loaded"&&document.readyState!="complete")setTimeout(arguments.callee,0);else{if(a===void 0){for(var b=document.getElementsByTagName("link"),c=0;c<b.length;c++)b[c].getAttribute("rel")=="stylesheet"&&a++;b=document.getElementsByTagName("style");a+=b.length}document.styleSheets.length!=a?setTimeout(arguments.callee, 0):e()}})()}j(e)}}var k=window.DomReady={},b=navigator.userAgent.toLowerCase(),f={version:(b.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)||[])[1],safari:/webkit/.test(b),opera:/opera/.test(b),msie:/msie/.test(b)&&!/opera/.test(b),mozilla:/mozilla/.test(b)&&!/(compatible|webkit)/.test(b)},i=!1,d=!1,c=[];k.ready=function(a){h();d?a.call(window,[]):c.push(function(){return a.call(window,[])})};h()})();

  var createPipe = function() {
    var pipe = document.createElement("iframe");
    pipe.src = ENDPOINT;
    pipe.style.display = "none";
    pipe.style.height = pipe.style.width = 0;
    document.body.appendChild(pipe);
    return pipe.contentWindow;
  }
  
  var queue = function(method) {
    queue._[method] = (queue._[method] || []);
    return function() { queue._[method].unshift(arguments); }
  }
  queue._ = {};
  queue.flush = function(obj, method) {
    var invocation = queue._[method];
    if (typeof invocation === "undefined") return;
    for (var i = invocation.length - 1; i >= 0; i--) {
      obj[method].apply(obj, invocation[i]);
    }
  }
  
  badgeAPI.add = queue("add");
  badgeAPI.update = queue("update");
  badgeAPI.revoke = queue("revoke");
  badgeAPI.setKey = queue("setKey");
  
  DomReady.ready(function(){
    var badgeChannel = Channel.build({
      window: createPipe(),
      origin: ORIGIN,
      scope: "badges"
    })
    badgeAPI.add = function(location){
      badgeChannel.call({
        method: "add",
        params: location,
        success: function(response){ console.log('success', response); },
        error: function(err){ console.dir(err); }
      })
    }
    queue.flush(badgeAPI, "add");
    queue.flush(badgeAPI, "update");
    queue.flush(badgeAPI, "revoke");
    queue.flush(badgeAPI, "setKey");
  });
}(this)
