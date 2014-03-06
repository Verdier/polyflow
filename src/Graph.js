'use strict';

var Network = require('./Network.js');
var Binder = require('./Binder.js');

var Graph = function (polyflow, name) {
    this.polyflow = polyflow;
    this.name = name;

    this.outputs = {};
    this.nodes = {};
    this.connexions = [];

    /* Add begin node. */
    this.addNode('core.forwarder', 'begin');

    /* Reset selection. */
    this._selected_node = null;
    this._selected_output = null;

    /* Binder */
    this.bind = null;
};

Graph.$addShortcut = function (componentName, shortcutName, Builder) {
    if (Graph.prototype[shortcutName] !== undefined) {
        throw new Error('Shortcut ' + shortcutName + ' is already defined');
    }
    Graph.prototype[shortcutName] = function () {
        var build = function (nodeName, param) {
            this.then(componentName, nodeName, param);
            return this;
        };
        build = build.bind(this);
        var builder = new Builder(build, this);
        return builder.$initialize.apply(builder, arguments) || builder;
    };
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
    this.bind = this.nodes[nodeName].binder;
    return this;
};

Graph.prototype.on = function (outputName) {
    this._selected_output = outputName;
    return this;
};

Graph.prototype.then = function (componentName, nodeName, param) {
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
        this.addNode(componentName, nodeName, param);
    }

    this.connect(source_node, source_output, this._selected_node);
    return this;
};

Graph.prototype.addNode = function (componentName, nodeName, param) {
    if (typeof componentName === 'function') {
        /* Create an anonymous nano */
        var fn = componentName;
        var nano = this.polyflow.nano(fn);
        componentName = nano.name;
    }
    if (typeof nodeName !== 'string') {
        /* Create a anonymous node */
        param = nodeName;
        nodeName = this.polyflow.$anonymous.make();
    }

    if (this.nodes[nodeName] !== undefined) {
        throw new Error('A node with the name ' + nodeName + ' is already defined');
    }

    this.nodes[nodeName] = {
        nodeName: nodeName,
        componentName: componentName,
        binder: new Binder(this, param)
    };

    this.select(nodeName);
    return this;
};

Graph.prototype.output = function (outputName) {
    if (this._selected_node === null) {
        throw new Error('No node selected');
    }
    if (this._selected_output === null) {
        throw new Error('No output selected');
    }

    if (this.outputs[outputName] === undefined) {
        this.outputs[outputName] = [];
    }
    this.outputs[outputName].push({
        nodeName: this._selected_node,
        outputName: this._selected_output
    });

    this._selected_node = null;
    this._selected_output = null;
    this.bind = null;
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
    var network = new Network(this.polyflow, this);
    network.finalize(null, null);
    return network;
};

module.exports = Graph;
