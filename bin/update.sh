#!/bin/bash
git pull origin development && \
    npm install && \
    npm test && \
    kill -s SIGHUP `cat openbadges/var/server.pid`

