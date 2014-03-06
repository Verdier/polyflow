/* jshint node: true, camelcase: false */
'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jsfiles: [
            'Gruntfile.js',
            'src/**/*.js',
            'tests/**/*.js'
        ],

        jsbeautifier: {
            files: ['<%= jsfiles %>'],
            options: {
                space_after_anon_function: true
            }
        },

        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                indent: 4,
                latedef: true,
                newcap: true,
                nonew: true,
                undef: true,
                unused: false,
                trailing: true,
                white: true,
                globalstrict: true,
                node: true,
                devel: true,
                globals: {
                    /* Jasmine variables. */
                    jasmine: false,
                    it: false,
                    describe: false,
                    expect: false,
                    beforeEach: false,
                    runs: false,
                    waitsFor: false
                }
            },
            files: ['<%= jsfiles %>']
        },

        jasmine_node: {
            match: '.',
            matchall: false,
            extensions: 'js',
            specNameMatcher: 'spec',
            projectRoot: '.',
            requirejs: false,
            forceExit: true,
            jUnit: {
                report: false,
                savePath: 'tests/reports/',
                useDotNotation: true,
                consolidate: true
            },
            all: ['tests/spec/']
        },

        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jsbeautifier', 'jshint', 'jasmine_node']
        }
    });

    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('lint', ['jsbeautifier', 'jshint']);
    grunt.registerTask('test', ['jasmine_node']);
    grunt.registerTask('default', ['lint', 'test']);

};
