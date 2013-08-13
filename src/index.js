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

var tasker = {};

tasker.$anonymous = anonymous;
tasker.$injector = injector;
tasker.Stream = Stream;

tasker._components = {};

tasker.getComponent = function (name) {
    if (tasker._components[name] === undefined) {
        throw new Error('Undefined component ' + name);
    }
    return tasker._components[name];
};

tasker.service = function (name, factory) {
    injector.addService(name, factory);
};

tasker.nano = function (name, param, fn) {
    if (typeof name === 'function') {
        /* Create a anonymous nano */
        fn = name;
        name = anonymous.make();
        param = {};
    }
    if (fn !== undefined) {
        param.fn = fn;
    }
    var nano = new Nano(tasker, name, param);
    tasker._components[name] = nano;
    return nano;
};

tasker.graph = function (name, param) {
    var macro = new Graph(tasker, name, param);
    tasker._components[name] = macro;
    return macro;
};

tasker.loadComponents = function (dirname) {
    var names = fs.readdirSync(dirname);
    names.forEach(function (name) {
        var fullname = path.join(dirname, name);
        if (fs.lstatSync(fullname).isDirectory()) {
            tasker.loadComponents(fullname);
        } else {
            require(fullname)(tasker);
        }
    });
};

var componentsDirname = path.join(__dirname, 'components');
tasker.loadComponents(componentsDirname);

module.exports = tasker;
