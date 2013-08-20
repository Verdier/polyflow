'use strict';

var util = require('util');
var Node = require('./Node.js');

var Nano = function (polyflow, name, param) {
    this.polyflow = polyflow;
    this.name = name;
    this.compiled = false;

    this.fn = param.fn;
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
        this.polyflow.$injector.inject(this.fn);
        /* Compute special service indices. */
        this.fn.$$inputsIndex = this.fn.$arguments.indexOf('$inputs');
        this.fn.$$outputsIndex = this.fn.$arguments.indexOf('$outputs');
        this.fn.$$streamIndex = this.fn.$arguments.indexOf('$stream');
        this.compiled = true;
    }
    return new Node(this.polyflow, this, binder);
};

module.exports = Nano;
