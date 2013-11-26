# Mozilla Open Badges Displayer API

Please send questions and comments to the [Google Group](https://groups.google.com/forum/#!forum/openbadges-dev).

## Note about Security

We send the assertion exactly as we received it, without any escaping or sanitization. You will want to do context-relevant escaping of any fields you plan on putting into your HTML. [Read more about Cross Site Scripting at the Open Web Application Security Project site](https://www.owasp.org/index.php/Cross-site_Scripting_%28XSS%29).

## Converting email → user ID

We avoid using email directly in the displayer API to discourage hardcoding email addresses. Instead, we use the internal userID and provide a conversion service at `http://beta.openbadges.org/displayer/convert/email`

### POST /displayer/convert/email
Expects `email` field, returns JSON including the `userId` of the email account. `userId` is used in the majority of calls.

### Examples

```bash
$ curl -i -X POST -d "email=brian@mozillafoundation.org" http://backpack.openbadges.org/displayer/convert/email
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"okay","email":"brian@mozillafoundation.org","userId":21}
```

```bash
$ curl -i -X POST -d "email=nonexistant@example.com" http://backpack.openbadges.org/displayer/convert/email
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"status":"missing","error":"Could not find a user by the email address `nonexistant@example.com`"}
```

```bash
$ curl -i -X POST -d "snailmail=what@example.com" http://beta.openbadges.org/displayer/convert/email
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"status":"invalid","error":"missing `email` parameter"}
```

You can also http://beta.openbadges.org/displayer/convert/email in your browser to get the `userId` directly.

## REST Queries

Queries are http requests that return `application/json` responses. Queries are based on a users' userid.  All endpoints send Cross-origin Resource Sharing headers, so you can use XHR requests directly; however, if preferred or necessary, all queries accept an optional <code>?callback=[function_name]</code> for JSONP style wrapping of responses.

### GET /displayer/[userid]/groups.json

A backpack user can expose groups of badges as public groups.  A users public groups are listed in JSON format at, <code>/displayer/[userid]/groups.json</code>.  An example response,

    {
      'userid' : 123456,
      'groups': [{ 'groupid': 123456,
                  'name'   : "My very fancy group",
                  'badges' : 12
                }, ...

### GET /displayer/[userid]/group/[groupid].json

A list of badges in a public group is exposed through the call, <code>/displayer/[userid]/group/[groupid].json</code>. An example response,

    {
      'userid'  : 123456,
      'groupid' : 123456,
      'badges'  : [{ 'badge assertion goes here' }]


## Widgets

Widgets to display badges on a users' collection of sites should use the JSON feeds above as a data source.
