# Open Badge Infrastructure
## Example assertion (with optional fields)
```javascript
{
  "recipient": "bimmy@example.com",
  "evidence": "/badges/html5-basic/bimmy",
  "expires": "2013-06-01",
  "issued_on": "2011-06-01",
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

## Field Descriptions

### Required
* **recipient**: E-mail address for the user recieving the badge.
* **badge**: The structure describing the badge.
  * **version**: The version of the spec/hub this manifest is compatible with. *Use "0.5.0" for the beta.*
  * **name**: Human-readable name of the badge being issued. *Maximum of 128 characters.*
  * **image**: URL for image representing the badge. *Should be a square and one of the following formats: PNG, JPG or GIF. Will be cached at the backpack. Maximum size of 512kb.*
  * **description**: Description of the badge being issued. *Maximum of 128 characters.*
  * **criteria**: URL describing the badge and criteria for earning the badge (Not the specific instance of the badge).
  * **issuer**: Information about the issuer:
    * **name** : Human-readable name of the issuing agent.
    * **org**: (OPTIONAL) Organization for which the badge is being issued. Another example is if a scout badge is being issued, the "name" could be "Boy Scouts" and the "org" could be "Troop #218"
    * **contact**: (OPTIONAL) A human-monitored email address associated with the issuer.
    * **url**: (OPTIONAL) Location for the issuer. Defaults to the root issuing domain if not provided.

### Optional
* **evidence**: User-specific URL with information about this specific badge instance. Should contain information about how the specific user earned the badge.
* **expires**: Date when the badge expires. If omitted, the badge never expires. The badge is not removed from the user's backpack after the expires date – there will be some visual/technical indicator that the badge is expired and needs to be re-upped. *Must be formatted "YYYY-MM-DD"*
* **issued_on**: Date when badge was issued. If omitted, the issue date will be set to whenever the hub recieved the badge.  *Must be formatted "YYYY-MM-DD"*

NOTE: We've discussed having an additional field that is customizable by the
user - so that the user could add a personal evidence URL, or could add
additional information or context to the badge. This would NOT be something
that they issuer would include in the badge manifest (so it is not listed
above) and would most likely be managed by the user through the Backpack.
