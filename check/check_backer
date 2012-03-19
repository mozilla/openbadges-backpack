#!/bin/sh
CHECK_HTTP=/usr/lib*/nagios/plugins/check_http

#XXX: This needs to be a valid assertion URL
ASSERTION_URL=http://people.mozilla.com/~pchiasson/badges/mrz.json

HOST=$1
shift

exec $CHECK_HTTP \
  -H $HOST \
  --header="Accept: application/json" \
  --regex='"status"\s*:"success"' \
  -u /baker?assertion=$ASSERTION_URL \
  $*

