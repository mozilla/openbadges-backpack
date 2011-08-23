## Badge Assertion
```javascript
{
  "recipient": "bimmy@example.com",
  "evidence": "/badges/html5-basic/bimmy",
  "expires": "2013-06-01",
  "issued_at": "2011-06-01"
  "badge": {
    "version": "0.5.0",
    "name": "HTML5 Fundamental",
    "image": "/img/html5-basic.png",
    "description": "Knows the difference between a <section> and an <article>",
    "criteria": "/badges/html5-basic",
    "issuer": {
      "name": "P2PU",
      "org": "School of Webcraft",
      "contact": "admin@p2pu.org",
      "url": "http://p2pu.org/schools/school-of-webcraft"
    }
  }
}
```
NOTE: If a URL is not fully-qualified it is assumed to be relative to the issuing domain.

## Rationale
It makes sense to separate the "badge" data -- the type & details of the
award/achievement being asserted on the user's behalf -- from the "instance"
data -- all of the information related to asserting that a specific user
should be awarded a badge.

Separating the badge into its own structure will also help moving forward.
Discoverability without leaking PII becomes easier, as well as third-party
endorsing of badge "classes", rather than having to deal with endorsing either
badge instances or issuers, one of which is too specific and the other too
broad.
