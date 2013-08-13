'use strict';

var annotate = require('./annotate.js');

var injector = {};

injector._services = {};
injector._service_instances = {};

injector.addService = function (name, factory) {
    injector._services[name] = factory;
};

injector.getService = function (name) {
    if (injector._service_instances[name] !== undefined) {
        return injector._service_instances[name];
    }
    if (injector._services[name] === undefined) {
        throw new Error('Undefined service ' + name);
    }

    var service = injector._services[name];
    var instance = injector.apply(service);

    injector._service_instances[name] = instance;
    return instance;
};

injector.apply = function (fn) {
    var $injects = injector.inject(fn);
    return fn.apply(fn, $injects);
};

injector.inject = function (fn) {
    if (fn.$injects !== undefined) {
        return fn.$injects;
    }

    var $arguments = annotate(fn);
    var $injects = [];
    $arguments.forEach(function (name) {
        var inject = injector.getService(name);
        $injects.push(inject);
    });

    fn.$injects = $injects;
    return $injects;
};

module.exports = injector;
