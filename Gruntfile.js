module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    stylus: {
      compile: {
        options: {
          paths: ['styl'],
          urlfunc: 'url',
          'include css': true,
          compress: false
        },
        files: {
          'dist/css/app.css': 'styl/app.styl'
        }
      }
    },

    jade: {
      compile: {
        options: {
          pretty: true,
          data: {
            debug: true
          }
        },
        files: {
          "dist/index.html": ["views/index.jade"]
        }
      }
    },


    browserify: {
      dist: {
        files: {
          'dist/js/app.js': ['js/*.js'],
        }
      }
    },


    watch: {
      src: {
        files: ['styl/*.styl', 'views/*.jade'],
        tasks: ['build']
      }
    }

  });


  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('build', ['jade:compile', 'stylus:compile', 'browserify:dist']);

};
