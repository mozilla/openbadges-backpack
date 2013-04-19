Acceptance testing is currently in an experimental state, so your
mileage may vary.

1. Get the [WebDriver/Selenium 2 Server][] JAR file.

2. Run Selenium Server. This is probably done with a command like:

        java -jar selenium-server.jar

3. Enter the root directory of your checkout and run the following:

        node acceptance-test/run-tests.js

If you need to customize things, `run-tests.js` supports the following
environment variables:

`WEBDRIVER_HOST`: The hostname of the selenium server. Defaults to
`localhost`.

`WEBDRIVER_PORT`: The port number of the selenium server. Defaults to `4444`.

`WEBDRIVER_APP_URL`: The URL that the selenium server should point
browsers at when testing the app. Defaults to `http://localhost:8888/`.

`WEBDRIVER_APP_PORT`: The port that the app should listen on. Defaults to
`8888`.

`WEBDRIVER_BROWSER`: The browser that the selenium server should use. Defaults
to `firefox`.

  [WebDriver/Selenium 2 Server]: http://seleniumhq.org/download/
