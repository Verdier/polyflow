'use strict';

var util = require('util');
var clone = require('./modules/clone.js');
var Node = require('./Node.js');

var Nano = function (polyflow, name, param) {
    this.polyflow = polyflow;
    this.name = name;
    this.compiled = false;

    this.fn = param.fn;
    this.connectPrevious = param.connectPrevious;
    this.connectNext = param.connectNext;
    this.finalize = param.finalize;
    this.allowMultipleOutputs = param.allowMultipleOutputs || false;

    this.inputs = param.inputs || null;
    this.outputs = param.outputs || null;

    if (util.isArray(this.outputs)) {
        this.outputs = {
            out: this.outputs
        };
    }
};

Nano.prototype.compile = function (binder) {
    if (!this.compiled) {
        /* Inject services */
        this.polyflow.$injector.inject(this.fn);

        /* Compute special service indices. */
        this.fn.$$inputsIndex = this.fn.$arguments.indexOf('$inputs');
        this.fn.$$outputsIndex = this.fn.$arguments.indexOf('$outputs');
        this.fn.$$flowIndex = this.fn.$arguments.indexOf('$flow');
        this.compiled = true;
    }
    /* Compile binder */
    var inputs = clone(this.inputs);
    var outputs = clone(this.outputs);
    binder = binder.$compile(inputs, outputs);

    return new Node(this.polyflow, this, binder);
};

module.exports = Nano;
