'use strict';

var Network = require('./Network.js');

var Graph = function (tasker, name, param) {
    this.tasker = tasker;
    this.name = name;

    this.inputs = null;
    if (param !== undefined && param.inputs !== undefined) {
        this.inputs = param.inputs;
    }

    this.outputs = null;
    if (param !== undefined && param.outputs !== undefined) {
        this.outputs = param.outputs;
    }

    this.nodes = {};
    this.connexions = [];

    /* Add begin node. */
    this.addNode('core.forwarder', 'begin');

    /* Reset selection. */
    this._selected_node = null;
    this._selected_output = null;
};

Graph.prototype.begin = function () {
    this._selected_node = 'begin';
    this._selected_output = 'out';
    return this;
};

Graph.prototype.select = function (nodeName, outputName) {
    if (this.nodes[nodeName] === undefined) {
        throw new Error('Node ' + nodeName + ' does not exists');
    }
    if (outputName === undefined) {
        outputName = 'out';
    }
    this._selected_node = nodeName;
    this._selected_output = outputName;
    return this;
};

Graph.prototype.on = function (outputName) {
    this._selected_output = outputName;
    return this;
};

Graph.prototype.then = function (componentName, nodeName, args) {
    if (this._selected_node === null) {
        throw new Error('No node selected');
    }
    if (this._selected_output === null) {
        throw new Error('No output selected');
    }

    var source_node = this._selected_node,
        source_output = this._selected_output;

    if (arguments.length === 1 && typeof componentName === 'string' && this.nodes[componentName] !== undefined) {
        /* Then function was called with an existing node name. */
        this.select(componentName);
    } else {
        this.addNode(componentName, nodeName, args);
    }

    this.connect(source_node, source_output, this._selected_node);
    return this;
};

Graph.prototype.addNode = function (componentName, nodeName, args) {
    if (typeof componentName === 'function') {
        /* Create an anonymous nano */
        var fn = componentName;
        var nano = this.tasker.nano(fn);
        componentName = nano.name;
    }
    if (nodeName !== undefined && typeof nodeName !== 'string') {
        args = nodeName;
        nodeName = undefined;
    }
    if (nodeName === undefined) {
        /* Create a anonymous node */
        nodeName = this.tasker.$anonymous.make();
    }
    if (this.nodes[nodeName] !== undefined) {
        throw new Error('A node with the name ' + nodeName + ' is already defined');
    }

    this.nodes[nodeName] = {
        nodeName: nodeName,
        componentName: componentName,
        args: args
    };

    this.select(nodeName);
    return this;
};

Graph.prototype.connect = function (nodeA, output, nodeB) {
    this.connexions.push({
        nodeA: nodeA,
        nodeB: nodeB,
        output: output
    });
    return this;
};

Graph.prototype.compile = function () {
    return new Network(this.tasker, this);
};

/* Shortcuts */

Graph.prototype.label = function (nodeName) {
    nodeName = nodeName || this.tasker.$anonymous.make();
    this.then('core.forwarder', nodeName);
    return this;
};

Graph.prototype.set = function (name, value, nodeName) {
    nodeName = nodeName || this.tasker.$anonymous.make();
    this.then('core.set', nodeName, {
        name: name,
        value: value
    });
    return this;
};

Graph.prototype.unset = function (name, value, nodeName) {
    nodeName = nodeName || this.tasker.$anonymous.make();
    this.then('core.unset', nodeName, {
        name: name
    });
    return this;
};

Graph.prototype.forEach = function (source, destination, nodeName) {
    nodeName = nodeName || this.tasker.$anonymous.make();
    this.then('core.forEach', nodeName, {
        source: source,
        destination: destination
    });
    return this;
};

Graph.prototype.append = function (value, destination, nodeName) {
    nodeName = nodeName || this.tasker.$anonymous.make();
    this.then('core.append', nodeName, {
        value: value,
        destination: destination
    });
    return this;
};

module.exports = Graph;
