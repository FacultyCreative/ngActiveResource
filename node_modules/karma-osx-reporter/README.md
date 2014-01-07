# karma-osx-reporter

> Reporter using Mac OS 10.8+ Notification Center to display results.

![image](http://f.cl.ly/items/2T350d1c0H30460U3W2Y/Screen%20Shot%202013-08-06%20at%201.46.47%20PM.png)

Built on top of [node-osx-notifier] and based on [AvnerCohen's code].

Only works with **Karma 0.9 or later** which enables custom plugins.

For more information on Karma see the [homepage].


## Installation

1. Install Karma and karma-osx-reporter plugin. The plugin requires Karma 0.9+, but Karma's stable version is now 0.10 so it's pretty easy.

  a. Globally. System-wide with `karma` available on command line.

    ```
    npm install -g karma
    npm install -g karma-osx-reporter
    ```

  b. Locally. If you want to install Karma to your project instead, add the dependencies to `package.json` and run `npm install`:

    ```js
    "devDependencies": {
      "karma": ">=0.9",
      "karma-osx-reporter": "*"
    }
    ```

    If you install locally, you'll need to run Karma using `node_modules/.bin/karma`.

  In any case, the plugin needs to be installed as a peer dependency to Karma (i.e. in the sibling folder). This just means you cannot use global Karma with local plugins or vice-versa.


2. Add dependency to the plugin section in Karma config file (syntax shown for Karma 0.9.3+):

  ```js
    karma.configure({
      ...
      plugins: [
        'karma-osx-reporter'
      ],
      ...
    })
  ```

3. Define it as a reporter in the config file

  ```js
  reporters: ['osx']
  ```

  or pass through the command line

  ```sh
  $ karma start --reporters=osx karma.conf.js
  ```


## License

MIT License


[node-osx-notifier]: https://github.com/azoff/node-osx-notifier
[AvnerCohen's code]: https://github.com/karma-runner/karma/commit/ffd48a7f9aa7bc9a27516393d4d592edc6b628f7
[homepage]: http://karma-runner.github.io
