#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

set -e

if [ "$1" == "src" ]; then
    SRC_BUILD=1
else
    BIN_BUILD=1
fi

progname=$(basename $0)

cd $(dirname $0)/..    # top level of the checkout

export GIT_REVISION=$(git log -1 --oneline | awk {'print $1'} )
export GIT_SERIAL=$(git rev-list --all  | wc -l )

PREFIX=openbadges-$GIT_REVISION
TARBALL=openbadges-$GIT_REVISION.tar.gz
SRPM=openbadges-$GIT_REVISION-*.src.rpm

if [ ! -f $SRPM ]; then
    SRC_BUILD=1
fi

if [ $SRC_BUILD ]; then
    rm -rf $PREFIX
    mkdir $PREFIX

    rsync -av \
        --exclude=rpmbuild/ \
        --exclude=.git/ \
        --exclude=var/ \
        --exclude=node_modules/ \
        ./ $PREFIX/

    cat scripts/openbadges.spec.in | \
        sed -e"s/%%gitrev%%/$GIT_REVISION/" | \
        sed -e"s/%%gitser%%/$GIT_SERIAL/" \
        > $PREFIX/openbadges.spec

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
fi

if [ $BIN_BUILD ]; then
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
    
fi
