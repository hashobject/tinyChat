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
      },
      compile_and_compress: {
        options: {
          paths: ['styl'],
          urlfunc: 'url',
          'include css': true,
          compress: true
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


    concat: {
      dist: {
        files: {
          'dist/js/app.js': ['js/jquery-2.1.0.min.js', 'js/underscore-min.js', 'js/uuid.js', 'js/page.js', 'js/drags.js', 'js/app.js'],
        }
      }
    },

    uglify: {
      minimize: {
        files: {
          'dist/js/app.js': ['dist/js/app.js']
        }
      }
    },

    watch: {
      src: {
        files: ['styl/*.styl', 'views/*.jade', 'js/*.js'],
        tasks: ['build']
      }
    }

  });


  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('build', ['jade:compile', 'stylus:compile', 'concat:dist']);
  grunt.registerTask('build-prod', ['jade:compile', 'stylus:compile_and_compress', 'concat:dist', 'uglify:minimize']);

};
