# Mozilla Hosted Backpack - Badge Baking API

Each awarded badge is represented as an assertion. An assertion is some JSON metadata and a badge image. You can "bake" the assertion data into a badge, meaning that the image has the JSON data embedded into it. See the [baking specification](https://github.com/mozilla/openbadges-specification/blob/master/Badge-Baking/latest.md) for a detailed overview of how baked badges work.

The Mozilla Backpack offers a REST API for baking data into your badge images. 

_You can alternatively bake badges using the Web interface at_: http://bakery.openbadges.org/

__You do not need to bake badges when using the [Issuer API](issuer_api.md) as it handles baking automatically.__

To use the baking API, you need to have your assertions prepared. If you don't have assertions built and stored yet, see these pages:

* [Issuer Onboarding](https://github.com/mozilla/openbadges/wiki/Open-Badges-Onboarding:-Issuers)
* [Assertion Information for the Uninitiated](https://github.com/mozilla/openbadges/wiki/Assertion-Information-for-the-Uninitiated)
* [Assertion Specification](https://github.com/mozilla/openbadges-specification/blob/master/Assertion/latest.md)
* [New Issuers: Give Yourself a Badge](https://github.com/mozilla/openbadges/wiki/New-Issuers:-Give-Yourself-a-Badge)
* [Issuer Checklist](https://github.com/mozilla/openbadges/wiki/Issuer-Checklist)
* [Badge tutorial](https://badgelab.herokuapp.com/)
* [Earn a Badge Issue a badge](http://weblog.lonelylion.com/2012/03/22/earn-a-badge-issue-a-badge/)
* [Assertion Validator](http://validator.openbadges.org/)

## Baking

The endpoint for baking a badge is `/baker`. You can make a `GET` request to the baking service, passing the URL of your badge assertion. The baker will retrieve the badge image file listed as `image` in the badge class linked to from your assertion JSON. The baker will embed the assertion data into that image and return it to you as a raw data stream. You can then save it as an image file, with the assertion data stored within it.

_Earners who use the Mozilla Backpack can upload baked images to their Backpacks and the embedded data will automatically be extracted._

### Expected request

```
GET <backpack-location>/baker
```

### Example request

In a Web browser, a successful call should result in the baked badge being downloaded:

```
http://backpack.openbadges.org/baker?assertion=http://yoursite.com/badge-assertion.json
```

In a terminal, a successful call can save the baked badge image locally:

```
curl http://backpack.openbadges.org/baker?assertion=http://yoursite.com/badge-assertion.json > baked-badge.png
```

### Possible errors

The baking service will perform a `HEAD` request and a `GET` request on your badge assertion to ensure validity. Then it will perform a `GET` request to retrieve the badge image included in the badge class JSON. 

You may recieve an error response from the baking sevice for any of the following reasons:

* your assertion is invalid
* your assertion could not be reached
* a request returned an invalid content type
* your image was unreachable
* your image was too large (>256kb)

Error responses will have the following structure:

```json
{
    "message": "Error message",
    "stack": "Error detail",
    "code": "error-code",
    "extra": 404
}
```
