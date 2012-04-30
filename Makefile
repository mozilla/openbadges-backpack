# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# we don't want to try to install the npm packages
all: lint
	npm test

lint:
	jshint middleware.js lib/*.js models/*.js controllers/*.js

clean:
	rm -rf node_modules rpmbuild *.rpm *.tar.gz

npm:
	npm install

rpm: srpm
	scripts/rpmbuild.sh

srpm:
	scripts/rpmbuild.sh src

test: npm
	npm test

jenkins_build: clean npm test rpm
