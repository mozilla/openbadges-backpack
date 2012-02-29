# Mozilla Open Badges
## Overview
We intend to provide an open set of specifications, tools and services for
generating verifiable badges that users can take with them wherever they go
and use however they like.

For more information, check out http://openbadges.org

## I'm an Issuer, how do I use this?

Requirements:

* Webserver capable of serving requests to the general internet.
* Ability to make a POST request from your server backend and read a JSON response.
* Email addresses of the users you wish to issue badges.
* Badge image must be in PNG format.

Usage example:

1. Generate an assertion (see below) for the user recieving the badge.
2. Store that assertion at a public-but-secret URL and serve it with
`content-type: application/json`
  
  * The assertion contains private information about a user, so you want a
    non-predictable URL scheme to prevent automated scraping.
  
  * This URL should be stable - any badge issued from it relies on its
    existence for verification.
  
  * Both of these problems will be solved in the near-term future by
    supporting signed assertions, so you'll only need to expose a URL
    containing your public key.

3. Make a POST request to the open badge creator with the assertion URL. If
validation passes, you will receive an HTTP 200 with `content-type: image/png`,
the body being a your `badge.image` with the assertion URL baked into it.
4. Send/give the image to the user (for example, email it).

### The Issuer Javascript API

We have an easy to use API built for Issuers to easily push badges into Users Backpacks, giving the User the ability to approve the push through a lightboxed modal.  The API is written in Javascript, and is includable in your project with just a few lines of JS. Full documentation is in the wiki - https://github.com/mozilla/openbadges/wiki/Issuer-API.

## Details

Please [see the page on Assertions](https://github.com/mozilla/openbadges/wiki/Assertions) to
learn how to format your assertions, and [see the page on Badge Baking](https://github.com/mozilla/openbadges/wiki/Badge-Baking) to
learn more about how to use the baking API and what kind of responses to
expect in case of error.

## I want to play with the code, where do I start?

### The easy way

[Use Vagrant](http://vagrantup.com/). `vagrant up` in the project root will spin
up a fully provisioned VM (it'll take about two or three minutes, longer if
you don't have a `lucid32` box), `vagrant ssh` to get into the VM, then
`start-server` will start up the server at
[http://localhost:8888](http://localhost:8888). The server will also watch for
changes, so you don't have to manually reload it.

### The hard way

1. Setup a MySQL database. Create a database and a user with full privileges on
   that db. For example:

        CREATE DATABASE openbadges;
        GRANT ALL PRIVILEGES ON openbadges.* TO badgemaker@localhost IDENTIFIED BY 'secret';
        CREATE DATABASE openbadges_test;
        GRANT ALL PRIVILEGES ON openbadges_test.* to badgemaker@localhost IDENTIFIED BY 'secret';

2. Copy the `openbadges/lib/environments/local-dist.js` to
   `openbadges/lib/environments/local.js` and edit the configuration to match
   your local development environment. The MySQL database credentials should
   match step #1. For example:

        database: {
          driver: 'mysql',
          host: '127.0.0.1',
          user: 'badgemaker',
          password: 'secret',
          database: 'openbadges'
        },

3. Install local dependencies: `npm install`

4. Run the test suite: `./node_modules/.bin/vows -i`

5. Start your server: `./node_modules/.bin/up -w -p 8888 app.js`

No matter which way you choose, you should join the
[Open Badges Google Group](https://groups.google.com/forum/#!forum/openbadges). If
you have any problems setting up the environment, feel free to post a message to the list.

### Optional: A real hostname

I like to be able to use http://openbadges.local for accessing the
project. Assuming you used vagrant, you can change the hostname in `local.js`
and do `sudo echo "33.33.33.11 openbadges.local" >> /etc/hosts` to make it
happen. If you're on OS X, you can also use
[Gas Mask](http://code.google.com/p/gmask/) for temporary hosts file switching
rather than having to manually edit /etc/hosts

## Related Projects
* https://github.com/lmorchard/django-badger -- Issuing app for Django
* https://github.com/PRX/badges_engine -- Rails Engine for issuing.
* https://github.com/openmichigan/open_badges -- Drupal module for managing/issuing badges
