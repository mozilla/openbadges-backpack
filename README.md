**We are retiring the Mozilla Backpack and transitioning to Badgr Backpack. More information at https://backpack.openbadges.org.badgr.io/**

# Open Badges Backpack-ng (Next Generation)
[![Build Status](https://travis-ci.org/mozilla/openbadges-backpack.png?branch=master)](https://travis-ci.org/mozilla/openbadges-backpack)
[![Dependencies](https://david-dm.org/mozilla/openbadges-backpack.svg)](https://david-dm.org/mozilla/openbadges-backpack)

## Welcome to the future of the Backpack

Backpack-ng (pronounced *'backpacking'*) is the next generation of the Backpack.  

Our team has been slugging away behind the scenes to ensure the Backpack stays relevant, maintained and loved.  

The [ng branch](https://github.com/mozilla/openbadges-backpack/tree/backpack-ng) is currently where all the heavy development has been taking place. It's where the following changes have been introduced:

* Updated the framework and most of the dependencies
* Removed Persona as the main authentication mechanism (which is due to be decommissioned on the 31st Nov 2016)
* Replaced Persona with [PassportJS](http://passportjs.org/) (which includes a Persona strategy/plugin to allow users to login with Persona until it is finally decommissioned).
* Added a new responsive theme

Although we've given the backpack a bit of a facelift, there are still some rough edges to smooth out. The front-end functionality is working as expected (that is, to say, we haven't spotted anything that is majorly broken!).  We're currently focusing our attention on the few remaining unit tests that are still failing (these mostly relate to the Backpack API).

## Call to action!

If you feel you have something to offer and would like to help develop/design the backpack and push things forward, please feel free to grab the codebase and start hacking.  Full setup instructions are below.

We welcome active collaborators, whether you want to discuss contributions to the code base or explore future developments, connect with us at backpack@digitalme.co.uk

## What is the Backpack?

The Mozilla Backpack is a placed to store your collections of Open Badges. The Backpack allows earners to import badges and manage them in groups, choosing whether each group is public or not. You can access the Mozilla Backpack Web front-end at: http://backpack.openbadges.org

The Backpack code includes tools for badge issuers and displayers, for pushing awarded badges to an earner's Mozilla Backpack and for retrieving an earner's badges for display.  If you're an issuer or displayer, you will find more information on how to start interacting with the Backpack at the bottom of this guide.

---

## I want to play with the code, where do I start?

### Creating a development environment

1. Setup a MySQL database. Create a database and a user with full privileges on
   that db. For example:

        CREATE DATABASE openbadges;
        GRANT ALL PRIVILEGES ON openbadges.* TO badgemaker@localhost IDENTIFIED BY 'secret';
        CREATE DATABASE test_openbadges;
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

3. Install external tools:
  * [PhantomJS](http://phantomjs.org): We use PhantomJS for running some unit tests. On a debian based Linux system you can run `sudo apt-get install phantomjs` to install and run `phantomjs --version` to check it is installed. For other systems you can try [downloading](http://phantomjs.org/download.html) and installing it or [building it from source](http://phantomjs.org/build.html).

4. Install local dependencies: `npm install`

5. Run the test suite: `npm test`

6. Start your server: `npm start`

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

### Database Migrations

If you need to modify the database schema, you'll want to create a
migration. You can do this as follows:

1. Come up with an alphanumeric name for your migration, e.g.
   `add-issuer-column`.

2. Run `./bin/db-migrate create add-issuer-column`. This will create a new JS
   file preixed with a timestamp in the `migrations` directory.
   Something like the following should be displayed:

       [INFO] Created migration at
       migrations/20130213205310-add-issuer-column.js

3. Edit the new JS file as per the [node-db-migrate][] instructions.

4. Try out your migration using `./bin/db-migrate up`.

5. Try rolling back your migration using `./bin/db-migrate down`.

And finally, note that during development, `npm start` automatically runs
`./bin/db-migrate up` for you. For production use, you'll need to manually
run this command yourself whenever you deploy changes that involve a
schema change.

If you want to write tests for your migration, check out
`test/migration.test.js` for inspiration.

  [node-db-migrate]: https://github.com/nearinfinity/node-db-migrate#creating-migrations

### Production

The codebase behaves slightly differently when run in an environment where
environment variable `NODE_ENV=production`. These differences include:

* less verbose logging
* using precompiled templates for client-side rendering
  * run `bin/template-precompile` to generate
* "Test Site" banner will not show in the UI

### Heroku

Heroku relies upon the [habitat](https://github.com/brianloveswords/habitat) environment variables loader library.  The config for this can be found in [lib/environments/heroku.js](lib/environments/heroku.js).

When configuring your environment variables on heroku, they should be prefixed with the string that is passed to the habitat constructor. For example, if we pass the string "openbadges" to our habitat constructor, like so: `new Habitat("openbadges")`, then in heroku our protocol env var would be "OPENBADGES_PROTOCOL" (with, in this case, a value set to either http or https).

Currently, the heroku env var config looks like so...


| ENV VAR                         | VALUE EXAMPLE                                     |
| ------------------------------- | ------------------------------------------------- |
| NODE_ENV                        | "heroku"                                          |
| OPENBADGES_ADMINS               | "['admin@somewhere.com','someone@somewhere.com']" |
| OPENBADGES_BADGE_PATH           | "static/_badges"                                  |
| OPENBADGES_DATABASE_DATABASE    | "openbadges"                                      |
| OPENBADGES_DATABASE_DRIVER      | "mysql"                                           |
| OPENBADGES_DATABASE_HOST        | "eu-cdbr-west-01.cleardb.com"                     |
| OPENBADGES_DATABASE_PASSWORD    | "pa55w0rd"                                        |
| OPENBADGES_DATABASE_USER        | "user"                                            |
| OPENBADGES_FORCE_HTTPS          | true                                              |
| OPENBADGES_HOSTNAME             | "backpack-ng.herokuapp.com"                       |
| OPENBADGES_IDENTITY_PATH        | "/verify"                                         |
| OPENBADGES_IDENTITY_PROTOCOL    | "https"                                           |
| OPENBADGES_IDENTITY_SERVER      | "verifier.login.persona.org"                      |
| OPENBADGES_LESS_COMPRESS        | true                                              |
| OPENBADGES_LESS_ONCE            | true                                              |
| OPENBADGES_NEW_RELIC            | false                                             |
| OPENBADGES_NUNJUCKS_PRECOMPILED | true                                              |
| OPENBADGES_PROTOCOL             | "https"                                           |
| OPENBADGES_REMOTE_PORT          | "default"                                         |
| OPENBADGES_VAR_PATH             | "var"                                             |
| OPENBADGES_MAILER_SERVICE       | "mailgun"                                         |
| OPENBADGES_MAILER_USER          | "mailUser"                                        |
| OPENBADGES_MAILER_PASS          | "mailPa55word"                                    |

* NOTE: The mailer supports this [list of well-known services](https://github.com/nodemailer/nodemailer-wellknown#supported-services)

---

## Open Badges Specifications

To work with the Mozilla Backpack as either an issuer or a displayer, you will be handling Open Badge assertions, structured as JSON data according to the specification. See the [specification](https://github.com/mozilla/openbadges-specification) repo for a detailed overview and [Assertion Information for the Uninitiated](https://github.com/mozilla/openbadges/wiki/Assertion-Information-for-the-Uninitiated) for an introduction.

For more information about Open Badges, check out http://openbadges.org

## I'm an Issuer, how do I use this?

The Backpack includes the following tools for badge issuers:

* [Issuer API](docs/apis/issuer_api.md)
 * For pushing badges you have awarded the earner to their Mozilla Backpack, giving the earner the ability to approve the push through a lightboxed modal. The API is written in Javascript, and is includable in your project with just a few lines of JS.
* [Backpack Connect API](docs/apis/backpack_connect.md)
 * For pushing to the earner's Mozilla Backpack via persistent access, with permission granted by the earner.
* [Baker API](docs/apis/baking_api.md)
 * For embedding badge metadata into the badge image (_not required if you use the Issuer API_).

Requirements:

* Webserver capable of serving requests to the general internet.
* Ability to make a POST request from your server backend and read a JSON response.
* Email addresses of the users you wish to issue badges.
* Badge image must be in PNG format.

## I'm a Displayer, how do I use this?

The Backpack includes the [Displayer API](docs/apis/displayer_api.md), via which badge displayers can retrieve earner badges from their Mozilla Backpack. You will only be able to retrieve badges that the earner has chosen to make public. Given the earner email address, you can first use the conversion service to retrieve the earner's Backpack ID, then use that ID to query for public badge groups. Each group contains a list of badges awarded to the earner, inclding the information you need to present the badges within your site, application or other display implementation.
