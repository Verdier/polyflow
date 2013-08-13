'use strict';

var Knot = function (tasker, component) {
    this.tasker = tasker;
    this.component = component;
};

Knot.prototype.connect = function (out, node) {
    throw new Error('Knot.prototype.connect is not implemented.');
};

Knot.prototype.digest = function (model) {
    throw new Error('Knot.prototype.digest is not implemented.');
};

module.exports = Node;
