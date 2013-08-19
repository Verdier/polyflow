'use strict';

module.exports = function (polyflow) {

    polyflow.service('$parser', function ($clone) {

        var isSpecialString = function (arg) {
            return (arg.length > 2) &&
                ((arg.charAt(0) === "'" && arg.charAt(arg.length - 1) === "'") ||
                (arg.charAt(0) === '"' && arg.charAt(arg.length - 1) === '"'));
        };

        var $parser = {};

        $parser.makeExtractor = function (arg) {
            var extractor = {};
            extractor.$inputs = [];

            if (typeof arg === 'string') {
                if (isSpecialString(arg)) {
                    arg = arg.substring(1, arg.length - 1);
                    extractor.extract = function ($stream) {
                        return arg;
                    };
                } else {
                    var keys = arg.split('.');
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
                extractor.extract = function () {
                    return $clone(arg);
                };
            }

            return extractor;
        };

        $parser.makeInjector = function (path) {
            var injector = {};
            injector.$inputs = [];
            injector.$outputs = [];

            var keys = path.split('.');
            var firstKey = keys.shift();

            if (keys.length === 0) {
                injector.$outputs.push(firstKey);
                injector.inject = function (value, $stream) {
                    $stream[firstKey] = value;
                    return value;
                };
            } else {
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

        return $parser;
    });

};
