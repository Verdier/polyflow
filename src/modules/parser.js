'use strict';

var clone = require('./clone.js');

var isSpecialString = function (arg) {
    return (arg.length > 2) &&
        ((arg.charAt(0) === "'" && arg.charAt(arg.length - 1) === "'") ||
        (arg.charAt(0) === '"' && arg.charAt(arg.length - 1) === '"'));
};

var parser = {};

parser.makeExtractor = function (argument) {
    var extractor = {};
    extractor.$inputs = [];

    if (typeof argument === 'string') {
        if (isSpecialString(argument)) {
            /* Argument is a string value */
            argument = argument.substring(1, argument.length - 1);
            extractor.extract = function ($stream) {
                return argument;
            };
        } else {
            /* Argument is a name or a path */
            var keys = argument.split('.');
            var firstKey = keys.shift();
            extractor.$inputs.push(firstKey);
            extractor.extract = function ($stream) {
                var value = $stream.$get(firstKey);
                keys.forEach(function (key) {
                    value = value[key];
                });
                return value;
            };
        }
    } else {
        /* Argument is an object */
        extractor.extract = function () {
            return clone(argument);
        };
    }

    return extractor;
};

parser.makeInjector = function (argument) {
    var injector = {};
    injector.$inputs = [];
    injector.$outputs = [];

    if (argument === null) {
        /* Argument is ignored, nothing is
         * injected into the flow */
        injector.inject = function (value, $stream) {};
        return injector;
    }

    var keys = argument.split('.');
    var firstKey = keys.shift();

    if (keys.length === 0) {
        /* Argument is a name */
        injector.$outputs.push(firstKey);
        injector.inject = function (value, $stream) {
            $stream[firstKey] = value;
        };
    } else {
        /* Argument is a path */
        injector.$inputs.push(firstKey);
        var lastKey = keys.pop();
        injector.inject = function (value, $stream) {
            var obj = $stream.$get(firstKey);
            keys.forEach(function (key) {
                obj = obj[key];
            });
            obj[lastKey] = value;
        };
    }

    return injector;
};

module.exports = parser;
