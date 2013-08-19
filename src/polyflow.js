'use strict';

var fs = require('fs');
var path = require('path');

var Stream = require('./Stream.js');
var Graph = require('./Graph.js');
var Nano = require('./Nano.js');

var anonymous = require('./modules/anonymous.js');
var injector = require('./modules/injector.js');

/* Set specials services. */
injector.addService('$inputs', function () {
    return null;
});
injector.addService('$outputs', function () {
    return null;
});
injector.addService('$stream', function () {
    return null;
});
injector.addService('$param', function () {
    return null;
});

var polyflow = {};

polyflow.$anonymous = anonymous;
polyflow.$injector = injector;
polyflow.Stream = Stream;

polyflow._components = {};

polyflow.getComponent = function (name) {
    if (polyflow._components[name] === undefined) {
        throw new Error('Undefined component ' + name);
    }
    return polyflow._components[name];
};

polyflow.service = function (name, factory) {
    injector.addService(name, factory);
};

polyflow.nano = function (name, param, fn) {
    if (typeof name === 'function') {
        /* Create a anonymous nano */
        fn = name;
        name = anonymous.make();
        param = {};
    }
    if (fn !== undefined) {
        param.fn = fn;
    }
    var nano = new Nano(polyflow, name, param);
    polyflow._components[name] = nano;
    return nano;
};

polyflow.graph = function (name, param) {
    var macro = new Graph(polyflow, name, param);
    polyflow._components[name] = macro;
    return macro;
};

polyflow.loadComponents = function (dirname) {
    dirname = path.resolve(dirname);
    var names = fs.readdirSync(dirname);
    names.forEach(function (name) {
        var fullname = path.join(dirname, name);
        if (fs.lstatSync(fullname).isDirectory()) {
            polyflow.loadComponents(fullname);
        } else {
            require(fullname)(polyflow);
        }
    });
};

polyflow.loadComponents(path.join(__dirname, 'components'));
polyflow.loadComponents(path.join(__dirname, 'services'));

module.exports = polyflow;
