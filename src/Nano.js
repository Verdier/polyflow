'use strict';

var annotate = require('./modules/annotate.js');
var Node = require('./Node.js');

var Nano = function (polyflow, name, builder) {
    this.polyflow = polyflow;
    this.name = name;
    this.builder = builder;
};

Nano.prototype.compile = function (param) {
    var nano;
    if (typeof this.builder === 'function') {
        /* The nano is dynamic */
        this.polyflow.$injector.inject(this.builder);
        if (this.builder.$$paramIndex === undefined) {
            this.builder.$$paramIndex = this.builder.$arguments.indexOf('$param');
        }
        if (this.builder.$$paramIndex !== -1) {
            this.builder.$injects[this.builder.$$paramIndex] = param;
        }
        nano = this.builder.apply(null, this.builder.$injects);
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

    this.polyflow.$injector.inject(nano.fn);

    /* Compute special service indices. */
    nano.fn.$$inputsIndex = nano.fn.$arguments.indexOf('$inputs');
    nano.fn.$$outputsIndex = nano.fn.$arguments.indexOf('$outputs');
    nano.fn.$$streamIndex = nano.fn.$arguments.indexOf('$stream');

    return new Node(this.polyflow, nano);
};

module.exports = Nano;
