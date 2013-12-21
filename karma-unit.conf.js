// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    // @note as we add dependencies to our project, we must add them here, 
    // this is not ideal. @todo auto detect or auto add when scaffolding 
    // out new js files using yo. 
    files: [
      // ------------------------------
      // DEPENDENCIES  
      // ------------------------------
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/active-support/active-support.js',
      'bower_components/lodash/dist/lodash.js',
      'bower_components/async/lib/async.js',
      'bower_components/meld/meld.js',
      'lib/json/json.js',
      'lib/simple-form/**/*.js',
      'lib/angular-resource/**/*.js',
      'spec/angular-resource/**/*.js',
      'spec/simple-form/**/*.js'
    ],
    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    // @note our grunt tasks can over ride these settings. They are just default here. 
    // we do this with out auto_test grunt task. 
    autoWatch: false,

    // Start these browsers, currently available:
    // @note you must have the browser on the computer doing the testing 
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,
    
    reporters: ['progress', 'osx'],

    // provide green / red for apss / fail.
    colors: true

  });
};
