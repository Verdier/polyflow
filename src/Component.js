'use strict';

var Component = function (name, param) {
    this.name = name;
    this.inputs = param.inputs;
    this.outputs = param.outputs;
};

Component.prototype.compile = function () {
    throw new Error('Component.prototype.compile is not implemented.');
};

module.exports = Component;
