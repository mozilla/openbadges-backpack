Acceptance testing is currently in an experimental state, so your mileage may vary.

1. Get the [Selenium Server][] JAR file.

2. Run Selenium Server. This is probably done with a command like:

        java -jar selenium-server.jar

3. Enter the root directory of your checkout and run the following:

        node acceptance-test/run-tests.js

If you need to customize things, `run-tests.js` supports the following
environment variables:

`SELENIUM_HOST`: The hostname of the selenium server. Defaults to
`127.0.0.1`.

`SELENIUM_PORT`: The port number of the selenium server. Defaults to `4444`.

`SELENIUM_APP_URL`: The URL that the selenium server should point
browsers at when testing the app. Defaults to `http://127.0.0.1:8888/`.

`SELENIUM_APP_PORT`: The port that the app should listen on. Defaults to
`8888`.

`SELENIUM_BROWSER`: The browser that the selenium server should use. Defaults
to `firefox`.

  [Selenium Server]: http://seleniumhq.org/download/
