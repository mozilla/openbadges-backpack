#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

set -e

progname=$(basename $0)

cd $(dirname $0)/..    # top level of the checkout

export GIT_REVISION=$(git log -1 --oneline | awk {'print $1'} )
export GIT_SERIAL=$(git rev-list --all  | wc -l )

cat scripts/openbadges.spec.in | \
    sed -e"s/%%gitrev%%/$GIT_REVISION/" | \
    sed -e"s/%%gitser%%/$GIT_SERIAL/" \
    > openbadges.spec

PREFIX=openbadges-$GIT_REVISION
TARBALL=openbadges-$GIT_REVISION.tar.gz
SRPM=openbadges-$GIT_REVISION-*.src.rpm

rm -rf $PREFIX
mkdir $PREFIX
rsync -av --exclude=.git/ ./ $PREFIX/

tar --exclude rpmbuild --exclude .git \
    --exclude var --exclude=node_modules \
    --exclude=$TARBALL --ignore-failed-read \
    -czf $TARBALL $PREFIX

rm -rf $PREFIX

set +e

rpmbuild \
        --define "_topdir $PWD/rpmbuild" \
        --define "_gitrev $GIT_REVISION" \
        --define "_gitser $GIT_SERIAL" \
        -ts $TARBALL
rc=$?

if [ $rc -eq 0 ]; then
    ls -l $PWD/rpmbuild/SRPMS/$SRPM
    mv -f $PWD/rpmbuild/SRPMS/$SRPM .
else
    echo "$progname: failed to build openbadges SRPM (rpmbuild rc=$rc)" >&2
    exit $rc
fi

rpmbuild \
    --define "_topdir $PWD/rpmbuild" \
    --rebuild $PREFIX*.src.rpm
rc=$?

if [ $rc -eq 0 ]; then
    mv -f $PWD/rpmbuild/RPMS/*/$PREFIX*.rpm .
else
    echo "$progname: failed to build openbadges RPM (rpmbuild rc=$rc)" >&2
    exit $rc
fi


