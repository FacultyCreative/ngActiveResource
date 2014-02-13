module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  require('load-grunt-tasks')(grunt, {scope: ['dependencies', 'devDependencies']});


  grunt.initConfig({
    shell: {
      test: {
        options: { stdout: true },
        command: 'jasmine-node spec/'
      }
    },
    karma: {
      plugins: [
        'karma-osx-reporter'
      ],
      unit: {
        configFile: 'karma-unit.conf.js',
        autoWatch: false,
        singleRun: true
      },
      unitAuto: {
        configFile: 'karma-unit.conf.js',
        autoWatch: true,
        singleRun: false
      },
    },
    concat: {
      dist: {
        src: ['lib/json/*.js',
              'lib/angular-resource/**/*.js',
              'lib/simple-form/*.js'],
        dest: '.tmp/ng-active-resource.js'
      }
    },
    ngmin: {
      dist: {
        src: ['.tmp/ng-active-resource.js'],
        dest: 'dist/ng-active-resource.js'
      }
    },
    uglify: {
      dist: {
        src: 'dist/ng-active-resource.js',
        dest: 'dist/ng-active-resource.min.js'
      }
    }
  });

  grunt.registerTask('build', ['concat:dist', 'ngmin:dist', 'uglify:dist']);
  grunt.registerTask('test', 'shell:test');
  grunt.registerTask('autotest', [
    'autotest:unit' // - runs karma unit tests on file change
    // 'autotest:e2e'        // - runs end 2 end tests on all file changes
    //                       //   @note we disable this because end 2 end testing on every save
    //                       //   is overkill.
  ]);

  grunt.registerTask('autotest:unit', [
    'karma:unitAuto' // - runs karma tests using the unitAuto settings
    //
  ]);

}
