'use strict';

var fs = require('fs');
var path = require('path');

var Flow = require('./Flow.js');
var Graph = require('./Graph.js');
var Nano = require('./Nano.js');

var anonymous = require('./modules/anonymous.js');
var injector = require('./modules/injector.js');

/* Set specials services. */
injector.addServiceInstance('$inputs', null);
injector.addServiceInstance('$outputs', null);
injector.addServiceInstance('$flow', null);

var polyflow = {};

polyflow.$anonymous = anonymous;
polyflow.$injector = injector;
polyflow.Flow = Flow;

polyflow._components = {};

polyflow.getComponent = function (name) {
    if (polyflow._components[name] === undefined) {
        throw new Error('Undefined component ' + name);
    }
    return polyflow._components[name];
};

polyflow.injectService = function (name, service) {
    injector.addServiceInstance(name, service);
};

polyflow.getService = function (name) {
    return injector.getService(name);
};

polyflow.service = function (name, factory) {
    injector.addService(name, factory);
};

polyflow.nano = function (name, param, fn) {
    if (typeof name === 'function') {
        /* Anonymous nano */
        fn = name;
        name = anonymous.make();
        param = {};
    }
    if (fn !== undefined) {
        param.fn = fn;
    }

    var nano = new Nano(polyflow, name, param);
    polyflow._components[name] = nano;

    /* Add shortcut */
    if (param.shortcut !== undefined) {
        if (param.Builder === undefined) {
            throw new Error('No Builder define for shortcut ' + param.shortcut);
        }
        Graph.$addShortcut(name, param.shortcut, param.Builder);
    }

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

polyflow.loadServices = function (dirname) {
    var regex = /.js$/;
    dirname = path.resolve(dirname);
    var names = fs.readdirSync(dirname);
    names.forEach(function (name) {
        var fullname = path.join(dirname, name);
        if (fs.lstatSync(fullname).isFile() && name.search(regex) !== -1) {
            var serviceName = name.replace(regex, '');
            var service = require(fullname);
            if (typeof service !== 'function') {
                throw new Error('Bad service ' + serviceName + ' in file ' + fullname);
            }
            polyflow.service(serviceName, service);
        }
    });
};

polyflow.loadComponents(path.join(__dirname, 'components'));

module.exports = polyflow;
