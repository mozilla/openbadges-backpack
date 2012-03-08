Acceptance testing is currently in an experimental state, so your mileage may vary.

The following instructions assume that you are developing using Vagrant.

1. Enter the `acceptance-test` directory of your checkout and run:

        cp local-config.js.sample local-config.js

2. Edit the `local-config.js` file as necessary.

3. Get the [Selenium Server][] JAR file.

4. Run Selenium Server *on your host machine*, not the Vagrant VM. This is probably done with a command like:

        java -jar selenium-server.jar

5. From an SSH session to your VM, enter the root directory of your checkout and run the following:

        node acceptance-test/run-tests.js

The basic idea is that your VM is sending "orders" to the Selenium server on your host machine. The Selenium server runs on your host machine because it's the one that can easily start browsers&mdash;running the Selenium server on the VM would mean you'd have to install X and at least one browser.

  [Selenium Server]: http://seleniumhq.org/download/
