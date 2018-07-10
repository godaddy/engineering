---
layout: post
title: "React Native Application UI testing using WebDriverIO and Appium"
date: 2018-07-09 22:58:15 -0800
cover: /assets/images/react-native-wdio/cover-wdio.png
excerpt: We recently adopted WebDriverIO based UI testing for our React Native application. Benefits of using WebDriverIO include allowing us to write UI tests just as we wrote tests for the web. WebDriverIO configuration allows us to plugin SauceLabs Emulators or Real Devices for cloud-based testing.
authors:
  - name: Raja Panidepu
    url: https://www.linkedin.com/in/rpanidepu/
    photo: /assets/images/rpanidepu.png
---


## Motivation:
I work on a Mobile App team which employs the React Native Framework. Just as we wrote JavaScript code to develop React Native components for the Android and iOS platforms, we wanted to write our UI tests in a similar fashion where we are able to re-use the tests across iOS and Android platforms. In order to achieve that we explored few options and the final answer we found was WebDriverIO + Appium.

WebDriverIO is a Node.js implementation of the WebDriver Protocol. WebDriverIO is one of the most popular web UI testing frameworks and it also supports native mobile UI testing through its plug-in architecture. The [synchronous nature of WebDriverIO](http://webdriver.io/guide/getstarted/v4.html#It%E2%80%99s-all-synchronous) helps us write clean UI tests with PageObject models.

This article discusses setting up WebDriverIO for the following scenarios:
1. UI tests running locally using emulators
2. Using a cloud-based service to run on emulators
3. Using a cloud-based service to run on real devices
4. Timeouts at various levels


## Part 1: Set up WebDriverIO to run native UI tests locally

In your React Native project's directory, let's install WebDriverIO and create a basic WebDriverIO config.

```console
$ npm install webdriverio -g
$ wdio config
```

![Screenshot showing wdio config](/assets/images/react-native-wdio/wdio-config.png)

Follow the prompts to create a base WebDriverIO configuration as shown in the above picture.

Note: For now, set the base URL to the default value: http://localhost; we will update that later. Once done, let WebDriverIO install all the needed packages.

Finally, the saved WebDriverIO config generated from `wdio config` can be found in `wdio.conf` at the root of the project:

```js
exports.config = {
  specs: [
    './test/specs/**/ *.js'
  ],
  exclude: [],
  maxInstances: 10,
  capabilities: [{
    maxInstances: 5,
    browserName: 'firefox'
  }],
  sync: true,
  logLevel: 'verbose',
  coloredLogs: true,
  deprecationWarnings: true,
  bail: 0,
  screenshotPath: './errorShots/',
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: 'jasmine',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function (passed, assertion) {
    }
  }
};
```

`wdio config` configures Jasmine as the default test runner, but you can change it by following the documentation at [WebDriverIO - Test Runner Frameworks](http://webdriver.io/guide/testrunner/frameworks.html). The above config is not yet ready for running mobile UI tests. Let's start tweaking it.

WebDriverIO supports multiple services, of which Appium is a test automation framework for use with native, hybrid, and mobile web apps. [WebDriverIO's Appium service](http://webdriver.io/guide/services/appium.html) lets you automatically run Appium server in the background, which passes on UI test commands to the mobile simulator/emulator.

Set up Appium for WebDriverIO:

**Step 1:** Install Appium and wdio-appium-service:
```console
$ npm install appium --save-dev
$ npm install wdio-appium-service --save-dev
```

**Step 2:** Provide capabilities based on the platform you would like to run tests on. Documents here provide insight into capabilities that are supported by Appium: https://appium.io/docs/en/writing-running-appium/caps/

You need to make the following changes to `wdio.conf` to configure WebDriverIO to use Appium and run iOS tests on iPhone 8:

```diff
exports.config = {
  specs: [
    './test/specs/**/*.js'
  ],
  exclude: [],
  maxInstances: 10,
+ services: ['appium'],
+ port: 4723,
- capabilities: [{
-    maxInstances: 5,
-    browserName: 'firefox'
-  }],
+ capabilities: [{
+   maxInstances: 1,
+   browserName: '',
+   appiumVersion: '1.7.2',
+   platformName: 'iOS',
+   platformVersion: '11.2',
+   deviceName: 'iPhone 8',
+   app: '<path to .app file>'
+ }],
  sync: true,
  logLevel: 'verbose',
  coloredLogs: true,
  deprecationWarnings: true,
  bail: 0,
  screenshotPath: './errorShots/',
- baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: 'jasmine',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function (passed, assertion) {
    }
  }
};
```

Please note this WebDriverIO config would work only on a Mac with Xcode and command line tools installed.

In the above config, we have added `appium`  to the services list and updated the port number to point to Appium's default port number. Notice that we have removed the `baseUrl` field as we don't need it.

Capabilities have an `app` field whose value should be set to the path of an `.apk` for Android or an `.app` iOS application. The usual location for this file is `<PROJECT_ROOT>/android/app/build/outputs/apk/<FILE_NAME.apk>` for an `.apk` or `<PROJECT_ROOT>/ios/build/Build/Products/Debug-iphonesimulator/<FILE_NAME.app>` for an `.app` file.

We should also set `maxInstances` to 1 to avoid running multiple tests in parallel and in turn possibly running out of memory on the computer executing these tests.

**Step 3:** Add a simple WebDriverIO UI test to run.

```js
// ./test/native/specs/simple-test.js
describe('My Simple test', () => {
  it('super test', () => {
    // For demo purpose
    browser.pause(2000);
    console.log('Hey, I ran!');
  });
});
```

Above is a dummy test block that installs the application on the emulator, opens the app, runs the test and closes the application.

**Run the test:**
For iOS and Android, make sure you have the required Xcode or Android Studio build tools set up to run React Native application. For Android, start the emulator before running the tests.

Run the UI test:

```console
$ wdio wdio.conf.js
```

![Screenshot showing wdio output](/assets/images/react-native-wdio/wdio-output.png)

Now you have a WebdriverIO UI test running against the local emulator. Explore [WebDriverIO Mobile API](http://webdriver.io/api.html) to write some solid UI tests.


## Part 2: Running UI tests using cloud service: SauceLabs

WebDriverIO officially supports some of the popular cloud services like SauceLabs and BrowserStack by providing a service plugin. Here at GoDaddy, we use SauceLabs for performing mobile UI testing on emulators and real devices.

Let's configure our current WebDriverIO test to run using the SauceLabs simulators.

**Step 1:** Install [WDIO Sauce Service](http://webdriver.io/guide/services/sauce.html)

```console
$ npm install wdio-sauce-service --save-dev
```

**Step 2:** Update the wdio.conf file.

```diff
- services: ['appium'],
+ services: ['sauce'],
+ host: 'ondemand.saucelabs.com',
- port: 4723,
+ port: 80,
+ user: SAUCE_USERNAME,
+ key: SAUCE_ACCESS_KEY
```

Use [Platform configurator by SauceLabs](https://wiki.saucelabs.com/display/DOCS/Platform+Configurator) to update your capabilities if needed.

**Step 3:** Upload your `.app` or `.apk` file to SauceStorage or any other accessible endpoint. Follow the documentation here: [Uploading Mobile Applications to Sauce Storage for Testing](https://wiki.saucelabs.com/display/DOCS/Uploading+Mobile+Applications+to+Sauce+Storage+for+Testing)

**Update App path in capabilities:**
```diff
- app: <app path>
+ app: sauce-storage:myapp.zip or app link
```

**Run the test:**
```console
$ wdio wdio.conf.js
```

Check the [SauceLabs Dashboard](https://saucelabs.com/beta/dashboard/tests) to make sure the test has run. The WebDriverIO Sauce service automatically sets test labels and results.


## Part 3: Running on Real Devices
SauceLabs also provides real device a testing solution through the TestObject platform. With some minor changes to the above `wdio.conf`, we can run UI tests on real devices.

First, create a project in the [TestObject dashboard](https://app.testobject.com/) and upload your `.ipa` or `.apk` file.

There is no official WebDriverIO TestObject service and at the time of writing this blog, SauceLabs and TestObject do not share the same API calls.

**Update `wdio.conf` file:**
```diff
- services: ['sauce'],
+ protocol: 'https',
+ host: 'us1.appium.testobject.com',
- port: '80',
+ port: '443',
+ path: '/api/appium/wd/hub',
capabilities: {
  ...
-  app: 'sauce-storage:myapp.zip'
+  testobject_api_key: <TESTOBJECT_ACCESS_KEY>,
+  testobject_app_id: <APP_ID>,
}
```

Refer to [Appium Capabilities for Real Device Testing](https://wiki.saucelabs.com/display/DOCS/Appium+Capabilities+for+Real+Device+Testing) to update your capabilities if needed.

**Run the UI test:**

```console
$ wdio wdio.conf
```

Check the [TestObject Dashboard](https://app.testobject.com/) to make sure the test has run. WebDriverIO does not update test labels and results for TestObject. Here are some references that can help update the test results: https://github.com/pizzasaurusrex/TestObject or https://gist.github.com/rajapanidepu/0e8c0f89671a8a563a7463f8c1ff0413


## Part 4: Timeouts
When we started to write UI tests and run them as part of CICD, timeouts played a very important role in making sure UI tests were stable. We observed that our tests were failing for reasons outside of the test code, such as the device not being ready or the app installation taking a long time.

There are various timeouts in play here at each level of tech stack: WebDriverIO, Mocha/Jasmine, Appium, and SauceLabs/TestObject. In our case, simple WebDriverIO tests kept failing intermittently until we completely understood the timeouts and tweaked them.

**WebDriverIO timeouts:**
- `connectionRetryTimeout`: Http request timeouts while trying to connect to Appium server.
- `waitforTimeout`: Timeout for all `waitFor` commands in the tests.

**TestFramework timeout:**
A test is declared as a failure if it isn't completed within a certain time. Test frameworks and their respective timeout options are listed below.

```js
// Mocha
mochaOpts: {
  timeout
}

// Jasmine
jasmineNodeOpts: {
  defaultTimeoutInterval
}

// Cucumber
cucumberOpts: {
  timeout
}
```

**Appium timeouts:**
The following timeouts deal with how long Appium should wait for Android Virtual Device (AVD) emulator or iOS simulator to be ready and for the app to be installed.
- `appWaitDuration`
- `deviceReadyTimeout`
- `androidDeviceReadyTimeout` (Android only)
- `androidInstallTimeout` (Android only)
- `avdLaunchTimeout` (Android only)
- `avdReadyTimeout` (Android only)
- `launchTimeout` (iOS only)

- `newCommandTimeout` - Limits how long (in seconds) Appium will wait for a new command from the client before assuming the client quit

**SauceLabs/TestObject timeouts:**
- `commandTimeout`: Similar to Appium's newCommandTimeout, but for SauceLabs. How long Selenium can take to run a command.
- `idleTimeout`: Limits how long a browser can wait for a test to send a new command. 
- `maxDuration`: Limit the total time taken to run a test.


## Conclusion:
I hope the above discussion helps you set up some infrastructure for running WebDriverIO UI tests locally and remotely for emulators and real devices. Occasionally, we did face few intermittent UI test failures due to the app being unresponsive after installation or network latency. We have addressed this issue by adding retry logic on top of the WebDriverIO command to re-run the failed test suites. 90% of the time these tests pass on the second run. We are continuing to write UI tests using WebDriverIO + Appium for native which turned out to be pretty effective for development teams while working with web and native.

GoDaddy is looking for a full-stack mobile engineer to join our next generation Customer Experience mobile team in Kirkland. The team is building our next generation experiences for our small business customers to help them start, grow, and run their venture. If you have the passion, enthusiasm, and ability to create compelling interactions for customers on their way to making their small businesses great, we would like to talk to you! Apply here: <https://careers.godaddy.com/job/cambridge/senior-software-engineer-mobile-focus/18045/8081067>


## References:
- [WebDriverIO API](http://webdriver.io/api.html)
- [Appium Capabilities](https://appium.io/docs/en/writing-running-appium/caps/)
- [TestObject API wrapper](https://github.com/pizzasaurusrex/TestObject)

Note: cover photo courtesy of <http://webdriver.io/>
