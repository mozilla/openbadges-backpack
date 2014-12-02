# Mozilla Hosted Backpack - Backpack Connect API

This document regards the Backpack Connect API for pushing earner badges to the Mozilla hosted Backpack. The API allows issuers to manage persistent access to the earner Backpack without requiring their explicit permission each time a new badge is issued. Earners grant permission when issuers first call the [`connect`](#connect) method, and can revoke this permission within their Backpack settings at any time. 

Interaction with the Backpack is implemented using access tokens. Issuers can use the [`issue`](#issue) endpoint to send badges to the Backpack, the [`refresh`](#refresh) endpoint to retrieve valid access tokens and the [`identity`](#identity) endpoint to retrieve hashed earner identity information.

__The Backpack Connect API contrasts with the [Issuer API](issuer_api.md), with which the earner has to grant permission each time you try to push a badge to their Backpack.__

In order to use the Backpack Connect API, you first need to have your badge assertions(s) prepared. If you're new to badge issuing or assertions, see these pages:

* [Issuer Onboarding](https://github.com/mozilla/openbadges/wiki/Open-Badges-Onboarding:-Issuers)
* [Assertion Information for the Uninitiated](https://github.com/mozilla/openbadges/wiki/Assertion-Information-for-the-Uninitiated)
* [Assertion Specification](https://github.com/mozilla/openbadges-specification/blob/master/Assertion/latest.md)
* [New Issuers: Give Yourself a Badge](https://github.com/mozilla/openbadges/wiki/New-Issuers:-Give-Yourself-a-Badge)
* [Issuer Checklist](https://github.com/mozilla/openbadges/wiki/Issuer-Checklist)
* [Badge tutorial](https://badgelab.herokuapp.com/)
* [Earn a Badge Issue a badge](http://weblog.lonelylion.com/2012/03/22/earn-a-badge-issue-a-badge/)
* [Assertion Validator](http://validator.openbadges.org/)

For a detailed guide to using the Backpack Connect API, see [the tutorial](https://github.com/mozilla/openbadges/wiki/Using-the-Backpack-Connect-API).

## Contents

* [Accessing the API](#accessing-the-api)
* _Methods and Endpoints_
 * [`connect`](#connect)
 * [`issue`](#issue)
 * [`token`](#token)
 * [`identity`](#identity)

## Accessing the API

To access the Backpack Connect API in your site, include the following script:

```
https://backpack.openbadges.org/issuer.js
```

You can then use the `OpenBadges` object to call the [`connect`](#connect) method to retrieve your access token for pushing earner badges to the Backpack.

## `connect`

Request earner permission to push issued badges to their Backpack.

|Parameters| |
|:---|:---|
|`callback`|URL for callback the Backpack will return your access token details to.|
|`scope`|Type of access you are requesting - use `issue` to push badges to the Backpack.|

### Example method call

```js
OpenBadges.connect({
        callback: "http://yoursite.com/callback",
        scope: ['issue']
    });
```

### Example response

You will receive a response at your specified `callback` including your access token details if successful. _The earner will be prompted to grant you access and the Backpack will send data to your callback when they do so, returning the earner browser to your callback location._

|Parameter| |
|:---|:---|
|`error`|If the user denied the issuer access to their backpack, this will be set to `access_denied`.|
|`access_token`|A string you can use to access the user's Backpack.|
|`refresh_token`|A string that can be used to obtain a new access token whenever yours expires.|
|`expires`|The number of seconds that the access token is valid before it needs to be refreshed.|
|`api_root`|The absolute URL pointing to the root of the user's backpack connect API endpoint. _Note that this won't necessarily point to the openbadges.org domain, since a user's Backpack may be located anywhere on the Web._|

The response is sent using `GET` parameters, e.g.

```
http://yoursite.com/callback?access_token=abcde&refresh_token=fghij&expires=3600&api_root=https%3A%2F%2Fbackpack.openbadges.org%2Fapi 
```

When `access_token` expires, you can call [`token`](#token) to retrieve a new one.

## `issue`

Push a badge you have awarded an earner to their Backpack. The endpoint is `/issue` appended to the `api_root` value you received when you called the [`connect`](#connect) method.

### Endpoint

```
POST <api-root>/issue
```

`Content-Type` should be `application/json`

### Expected request

The `issue` endpoint expects:

* your Base64 encoded `access_token` as `Bearer` in the `Authorization` header of the HTTP request
* the URL or signature for the badge assertion you are pushing to the earner Backpack as `badge` parameter

#### Example request

```js
var claimData = querystring.stringify({
            badge: 'http://yoursite.com/badge-assertion.json'
    });

var requestOptions = {
        host : 'backpack.openbadges.org',//adjust for your api root
        path : '/api/issue', 
        method : 'POST', 
        headers: { 'Authorization': 'Bearer ' + b64enc('your-access-token'),
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(claimData)
        }
};

var postRequest = http.request(requestOptions, function(pushResponse) {
      //...

});

postRequest.write(claimData);
```

### Expected response

```json
{
    "exists": false,
    "badge": {
        "uid": "assertion-uid",
        "recipient": "sha256$hashed-email",
        "badge": {
            "name": "Badge Name",
            "description": "Badge description.",
            "image": "http://yoursite.com/badge-image.png",
            "criteria": "http://yoursite.com/criteria.html",
            "alignment": [ ],
            "issuer": {
                "name": "Issuer Name",
                "url": "http://yoursite.com",
                "_location": "http://yoursite.com/issuer-organization.json",
                "origin": "http://yoursite.com"
            },
            "_location": "http://yoursite.com/badge-class.json"
        },
        "verify": {
            "url": "http://yoursite.com/public.pem",
            "type": "signed"
        },
        "issuedOn": 1403784577,
        "_originalRecipient": {
            "identity": "sha256$hashed-email",
            "type": "email",
            "hashed": true
        },
        "issued_on": 1403784577
    }
}
```

#### Example error response

```json
{
    "message": "issuer origin must be identical to bearer token origin"
}
```

The API may return an error if:

* the assertion is malformed/ invalid
* no assertion URL or signature is passed
* the assertion is for a different earner
* issuer origin does not match access token origin
* the badge has already been added to the earner Backpack
* your access token has expired
* the access token is invalid

## `token`

Retrieve a new token to replace an expired one. The endpoint is `/token` appended to the `api_root` value you received when you called the [`connect`](#connect) method.

### Endpoint

```
POST <api-root>/token
```

`Content-Type` should be `application/json`

### Expected request

The `token` endpoint expects:

* `grant_type` which should be `refresh_token` to retrieve a replacement for an expired token
* `refresh_token` which should be your `refresh_token` received when you called [`connect`](#connect) or [`token`](#token) previously

_The `Authorization` header is not required for this endpoint._

#### Example request

```js
var claimData = querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: 'your-refresh-token-value'
    });

//where api root is backpack.openbadges.org/api
var requestOptions = {
        host : 'backpack.openbadges.org',
        path : '/api/token', 
        method : 'POST', 
        headers: {'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(claimData)
        }
};

var postRequest = http.request(requestOptions, function(refreshResponse) {
    //...
});

postRequest.write(claimData);
```

### Expected response

```json
{
    "expires": 3600,
    "access_token": "new-access-token",
    "refresh_token": "new-refresh-token"
}
```

* The new `access_token` should be used for any subsequent calls to [`issue`](#issue). 
* The new `refresh_token` should be used for any subsequent call to [`token`](#token).

## `identity`

Retrieve the hashed email for the current Backpack user. _You can use this to issue badges without direct access to the earner email address._ The endpoint is `/identity` appended to the `api_root` value you received when you called the [`connect`](#connect) method.

### Endpoint

```
GET <api-root>/identity
```

### Expected request

The `identity` endpoint expects:

* your Base64 encoded `access_token` as `Bearer` in the `Authorization` header of the HTTP request

#### Example request

```js
var requestOptions = {
            host : 'backpack.openbadges.org',//adjust for your api root
            path : '/api/identity', 
            method : 'GET',
            headers: { 'Authorization': 'Bearer ' + b64enc('your-access-token') }
    };

var idRequest = http.request(requestOptions, function(idResponse) {
    //...
});
```

### Expected response

```json
{
    "recipient": "sha256$hashed-email",
    "salt": "_123abc456",
    "type": "email"
}
```

These values can be used directly within a new badge assertion with the following fields:

* `recipient` `identity` set to the received `recipient` value
* `hashed` set to `true`
* `type` set to `email`
* `salt` set to the recieved `salt` value
