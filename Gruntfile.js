module.exports = function(grunt) {
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
    },
    clean: [".tmp"]
  });

  grunt.registerTask('build', ['concat:dist', 'ngmin:dist', 'uglify:dist', 'clean']);
  grunt.registerTask('test', 'shell:test');
  grunt.registerTask('autotest', [
    'autotest:unit' 
  ]);

  grunt.registerTask('autotest:unit', [
    'karma:unitAuto' 
  ]);

}
