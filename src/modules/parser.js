'use strict';

var clone = require('./clone.js');

var isSpecialString = function (arg) {
    return (arg.length > 2) &&
        ((arg.charAt(0) === "'" && arg.charAt(arg.length - 1) === "'") ||
        (arg.charAt(0) === '"' && arg.charAt(arg.length - 1) === '"'));
};

var makeSubExtractor = function (src) {
    var extractor = {};
    extractor.$inputs = [];

    if (typeof src === 'string') {
        if (isSpecialString(src)) {
            src = src.substring(1, src.length - 1);
            extractor.extract = function ($stream) {
                return src;
            };
        } else {
            var keys = src.split('.');
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
            return clone(src);
        };
    }

    return extractor;
};

var makeSubInjector = function (target) {
    var injector = {};
    injector.$inputs = [];
    injector.$outputs = [];

    var keys = target.split('.');
    var firstKey = keys.shift();

    if (keys.length === 0) {
        injector.$outputs.push(firstKey);
        injector.inject = function (value, $stream) {
            $stream[firstKey] = value;
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

var parser = {};

parser.makeExtractor = function (sources, binder) {
    var extractor = {};
    extractor.$inputs = [];
    extractor.$extractors = {};

    sources.forEach(function (src) {
        var boundSrc = src;
        if (binder[src] !== undefined) {
            boundSrc = binder[src];
        }
        var subExtractor = makeSubExtractor(boundSrc);
        extractor.$extractors[src] = subExtractor;
        extractor.$inputs = extractor.$inputs.concat(subExtractor.$inputs);
    }, this);

    extractor.$inputs = extractor.$inputs.filter(function (elem, pos) {
        return extractor.$inputs.indexOf(elem) === pos;
    });

    extractor.extract = function (stream) {
        var values = {};
        sources.forEach(function (src) {
            var subExtractor = extractor.$extractors[src];
            values[src] = subExtractor.extract(stream);
        });
        return values;
    };

    return extractor;
};

parser.makeInjector = function (targets, binder) {
    var injector = {};
    injector.$inputs = [];
    injector.$outputs = [];
    injector.$injectors = {};

    targets.forEach(function (target) {
        var subInjector = makeSubInjector(binder[target] || target);
        injector.$injectors[target] = subInjector;
        injector.$inputs = injector.$inputs.concat(subInjector.$inputs);
        injector.$outputs = injector.$outputs.concat(subInjector.$outputs);
    }, this);

    injector.$inputs = injector.$inputs.filter(function (elem, pos) {
        return injector.$inputs.indexOf(elem) === pos;
    });
    injector.$outputs = injector.$outputs.filter(function (elem, pos) {
        return injector.$outputs.indexOf(elem) === pos;
    });

    injector.inject = function (values, stream) {
        targets.forEach(function (target) {
            injector.$injectors[target].inject(values[target], stream);
        });
    };

    return injector;
};

module.exports = parser;
