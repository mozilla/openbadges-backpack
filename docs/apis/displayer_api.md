# Mozilla Hosted Backpack - Displayer API

This document introduces the Displayer API to query the Backpack for an earner's public badges. If you are looking to display earner badges in a site, application or widget, read on. If you're new to Open Badge assertions, see the following resources:

* [Assertion Information for the Uninitiated](https://github.com/mozilla/openbadges/wiki/Assertion-Information-for-the-Uninitiated)
* [Assertion Specification](https://github.com/mozilla/openbadges-specification/blob/master/Assertion/latest.md)

As a displayer, you can query the Mozilla Backpack for the badges an earner has chosen to make public. The earner can organize their badges into groups, which your REST API calls will query. 

To access the earner's badges, you need their unique ID within the Backpack. You can pass an earner email address to the [`convert`](#convert-earner-email-to-id) service to retrieve the earner ID, which you can then use in your calls to the Displayer API.

The Displayer API REST queries allow you to retrieve an earner's public groups and the badge data within specific groups. When you retrieve the data for a specific group, it will include the data for the earner's awarded badges - you can then parse that data and present it within your own display context.

## Notes

* Both the email conversion and the badge query requests return `application/json` responses.
* All endpoints send Cross-Origin Resource Sharing headers, so you can use XHR requests directly. However, if preferred or necessary, all queries accept an optional `?callback=[function_name]` for JSONP-style wrapping of responses.

## Contents

* [Convert Earner Email to ID](#convert-earner-email-to-id)
* [Retrieve Groups](#retrieve-groups)
* [Retrieve a Specific Group](#retrieve-a-specific-group)
* [Widgets](#widgets)
* [Security](#security)

## Convert Earner Email to ID

We avoid using email directly in the Displayer API to discourage hardcoding email addresses. Instead, we use an internal user ID and provide a conversion service at `http://backpack.openbadges.org/displayer/convert/email`. You can access the service in your Web browser at the same URL, entering the earner email address to retrieve their Backpack ID.

To access the conversion service in your terminal or application code, use the following details.

### Expected Request

```
POST /displayer/convert/email
```

#### Parameters

* `email` __required__ - _email address for earner whose public badges you intend to display_

#### Example Requests

cURL example:

```bash
$ curl -i -X POST -d "email=earner@example.org" http://backpack.openbadges.org/displayer/convert/email
```

The following represents an example call to the `convert` service in a node.js app:

```js
var earnerData = JSON.stringify({
	email: 'earner@example.org'
	});

var requestOptions = {
	host : 'backpack.openbadges.org', 
	path : '/displayer/convert/email', 
	method : 'POST', 
	headers: {'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(earnerData)
	}
};

var postRequest = http.request(requestOptions, function(requestResponse) {
//process response
});

//...

postRequest.write(earnerData);
```

### Expected Response

Returns JSON including the `userId` for the request earner email - _you can then use this to query the earner's badges_.

#### Example Response

```bash
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

```json
{
    "status": "okay",
    "email": "earner@example.com",
    "userId": 12345
}
```

### Potential Errors

#### Missing 

```bash
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
```

```json
{
    "status": "missing",
    "error": "Could not find a user by the email address `earner@example.org`"
}
```

#### Invalid

```bash
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
```

```json
{
    "status": "invalid",
    "error": "missing `email` parameter"
}
```



## Retrieve Groups

### GET /displayer/[userid]/groups.json

A backpack user can expose groups of badges as public groups.  A users public groups are listed in JSON format at, <code>/displayer/[userid]/groups.json</code>.  An example response,

    {
      'userid' : 123456,
      'groups': [{ 'groupid': 123456,
                  'name'   : "My very fancy group",
                  'badges' : 12
                }, ...

## Retrieve a Specific Group

### GET /displayer/[userid]/group/[groupid].json

A list of badges in a public group is exposed through the call, <code>/displayer/[userid]/group/[groupid].json</code>. An example response,

    {
      'userid'  : 123456,
      'groupid' : 123456,
      'badges'  : [{ 'badge assertion goes here' }]


## Widgets

Widgets to display badges on a users' collection of sites should use the JSON feeds above as a data source.

## Security

We send the assertion exactly as we received it, without any escaping or sanitization. You will need to carry out context-relevant escaping of any fields you plan on including in output HTML. [Read more about Cross Site Scripting at the Open Web Application Security Project site](https://www.owasp.org/index.php/Cross-site_Scripting_%28XSS%29).
