'use strict';

var Node = require('./Node.js');

var Nano = function (tasker, name, builder) {
    this.tasker = tasker;
    this.name = name;
    this.builder = builder;
};

Nano.prototype.compile = function (param) {
    var nano;
    if (typeof this.builder === 'function') {
        /* The nano is dynamic */
        nano = this.builder(param);
    } else {
        /* The nano is static */
        nano = this.builder;
    }

    if (nano.fn === undefined) {
        throw new Error('At least, a nano should define fn');
    }
    if (nano.allowMultipleOutputs === undefined) {
        nano.allowMultipleOutputs = false;
    }

    this.tasker.$injector.inject(nano.fn);

    /* Compute special service indices. */
    nano.fn.$$inputsIndex = nano.fn.$arguments.indexOf('$inputs');
    nano.fn.$$outputsIndex = nano.fn.$arguments.indexOf('$outputs');
    nano.fn.$$streamIndex = nano.fn.$arguments.indexOf('$stream');

    return new Node(this.tasker, nano);
};

module.exports = Nano;
