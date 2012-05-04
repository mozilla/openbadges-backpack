#!/bin/bash
git pull origin development && \
    npm install && \
    npm test && \
    kill -s SIGHUP `cat var/server.pid`

