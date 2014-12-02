# Mozilla Hosted Backpack - Displayer API

This document introduces the Displayer API to query the Backpack for an earner's public badges. If you are looking to display earner badges in a site, application or widget, read on. If you're new to Open Badge assertions, see the following resources:

* [Assertion Information for the Uninitiated](https://github.com/mozilla/openbadges/wiki/Assertion-Information-for-the-Uninitiated)
* [Assertion Specification](https://github.com/mozilla/openbadges-specification/blob/master/Assertion/latest.md)

As a displayer, you can query the Mozilla Backpack for the badges an earner has chosen to make public. The earner can organize their badges into groups (referred to as "collections" within the Backpack), which your REST API calls will query. 

To access the earner's badges, you need their unique ID within the Backpack. You can pass an earner email address to the [`convert`](#convert-earner-email-to-id) service to retrieve the earner ID, which you can then use in your calls to the Displayer API.

The Displayer API REST queries allow you to [retrieve an earner's public groups](#retrieve-groups) and the [badge data within specific groups](#retrieve-a-specific-group). When you retrieve the data for a specific group, it will include the data for the earner's awarded badges - you can then parse that data and present it within your own display context.

__For a step-by-step guide to displaying Backpack badges, see [Using the Displayer API](https://github.com/mozilla/openbadges/wiki/Using-the-Displayer-API).__
				
## Notes

* Both the email conversion and the badge query requests return `application/json` responses.
* All endpoints send Cross-Origin Resource Sharing headers, so you can use XHR requests directly. However, if preferred or necessary, all queries accept an optional `?callback=[function_name]` for JSONP-style wrapping of responses.

## Contents

* [Convert Earner Email to ID](#convert-earner-email-to-id)
* [Retrieve Groups](#retrieve-groups)
* [Retrieve a Specific Group](#retrieve-a-specific-group)
* [Security](#security)

## Convert Earner Email to ID

We avoid using email directly in the Displayer API to discourage hardcoding email addresses. Instead, we use an internal user ID and provide a conversion service at `http://backpack.openbadges.org/displayer/convert/email`. You can access the service in your Web browser at the same URL, entering the earner email address to retrieve their Backpack ID.

To access the conversion service in your terminal or application code, use the following details.

### Expected Request

```bash
POST <backpack>/displayer/convert/email
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

var convertRequest = http.request(requestOptions, function(requestResponse) {
//process response
});

//...

convertRequest.write(earnerData);
```

### Expected Response

Returns JSON including the `userId` for the request earner email - _you can then use this to [query the earner's groups and badges](#retrieve-groups)_.

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

Backpack users can manage groups of badges and make them public. You can use the Displayer API to query for an earner's public groups - __then you can use the returned information to query for the earned badges within a group__. Your request for an earner's groups will include their Backpack user ID, which you can [convert from the email address](#convert-earner-email-to-id).

### Expected Request

```bash
GET <backpack>/displayer/<user-id>/groups
```

#### Example Requests

cURL example:

```bash
curl -i -X GET http://backpack.openbadges.org/displayer/12345/groups.json
```

In the Web browser:

```
http://backpack.openbadges.org/displayer/12345/groups.json
```

The following code demonstrates the request in a node.js app:

```js
var earnerId = 12345;//retrieved from the convert service
var requestOptions = {
	host : 'backpack.openbadges.org', 
	path : '/displayer/'+earnerId+'/groups', 
	method : 'GET'
};

var displayRequest = http.request(requestOptions, function(reqResponse) {
	//process the response..
	
});

//...

```

### Expected Response

Returns JSON including an array of the earner's public badge groups - __you can parse the returned data to include in a [request for a particular group](#retrieve-a-specific-group)__.

#### Example Response

```bash
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
	"userId": 12345,
	"groups": [
        {
            "groupId": 67890,
            "name": "My Badge Group",
            "badges": 3
        },
        ...
	]
}
```

The response includes the user ID and `groups`, an array including group items, each of which includes a `groupId`, `name` and number of `badges`. When you parse the JSON response, you will particularly  want to retrieve the `groupId`, which you can then include in a request to retrieve that group's badges.

### Potential Errors

Not found.

```bash
HTTP/1.1 404 Not Found
Content-Type: application/json
```

```json
{
	"httpStatus": 404,
	"status": "missing"
}
```

## Retrieve a Specific Group

To retrieve the data for an earner's awarded badges, you need to make a request to the Displayer API for a particular group the earner has made public. Your request will include the group ID in question, which you can also [retrieve from the API](#retrieve-groups) 

### Expected Request

```bash
GET <backpack>/displayer/<user-id>/group/<group-id>
```

#### Example Requests

cURL example:

```bash
curl -i -X GET http://backpack.openbadges.org/displayer/12345/group/67890.json
```

In the Web browser:

```
http://backpack.openbadges.org/displayer/12345/group/67890.json
```

The following code demonstrates the request in a node.js app:

```js
var earnerId = 12345;//retrieved from convert service
var groupId = 67890;//retrieved from groups query
var requestOptions = {
	host : 'backpack.openbadges.org', 
	path : '/displayer/'+earnerId+'/group/'+groupId, 
	method : 'GET'
};

var displayRequest = http.request(requestOptions, function(reqResponse) {
	//process the response

});

//...

```

### Expected Response

Returns JSON including an array of the earner's badges in the specified group.

#### Example Response

```bash
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
	"userId": 12345,
	"groupId": 67890,
	"badges": [
	{
		"lastValidated": "2014-04-28T17:27:22.000Z",
		"hostedUrl": "http://example.org/badge-assertion.json",
		"assertion": {
			"uid": "abcde12345",
			"recipient": "sha256$abcde1345",
			"badge": {
				"name": "Badge Name",
				"description": "Badge description.",
				"image": "https://example.org/badge.png",
				"criteria": "https://example.org/criteria",
				"issuer": {
					"name": "Issuer Name",
					"url": "http://issuersite.org",
					"_location": "http://example.org/issuer-organization.json",
					"origin": "http://issuersite.org"
				},
			"_location": "http://issuersite.org/badge-class.json"
			},
			"verify": {
				"url": "http://example.org/badge-assertion.json",
				"type": "hosted"
			},
			"issuedOn": 1398705955,
			"_originalRecipient": {
				"identity": "sha256$abcde1345",
				"type": "email",
				"hashed": true
			},
			"issued_on": 1398705955
		},
		"imageUrl": "https://backpack.openbadges.org/images/badge/abcde12345.png"
	},
	...
	]
}
```

The response includes the user ID, group ID and list of badges. Each badge in the array is represented using its assertion, plus validation and location info. You can parse the returned badge information to include in your widget, site or application to display the earner's public badges.

### Potential Errors

Not found.

```bash
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
	"httpStatus": 404,
	"status": "missing"
}
```

## Security

We send the assertion exactly as we received it, without any escaping or sanitization. You will need to carry out context-relevant escaping of any fields you plan on including in output HTML. Read more about Cross Site Scripting at the [Open Web Application Security Project site](https://www.owasp.org/index.php/Cross-site_Scripting_%28XSS%29).
