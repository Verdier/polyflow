'use strict';

var Stream = require('./Stream.js');
var Node = require('./Node.js');

var Network = function (polyflow, graph) {
    this.graph = graph;
    this.nodes = {};

    Object.keys(graph.nodes).forEach(function (nodeName) {
        var definition = graph.nodes[nodeName];
        var component = polyflow.getComponent(definition.componentName);
        this.nodes[nodeName] = component.compile(definition.binder);
    }, this);

    graph.connexions.forEach(function (connexion) {
        var nodeA = this.nodes[connexion.nodeA],
            nodeB = this.nodes[connexion.nodeB];
        if (nodeB === undefined) {
            throw new Error('Node ' + connexion.nodeB + ' is not defined');
        }
        if (nodeA === undefined) {
            throw new Error('Node ' + connexion.nodeA + ' is not defined');
        }
        nodeA.connect(connexion.output, nodeB);
    }, this);
};

Network.prototype.connect = function (outputName, node) {
    if (this.graph.outputs[outputName] === undefined) {
        throw new Error('Undefined output ' + outputName);
    }
    this.graph.outputs[outputName].forEach(function (output) {
        if (this.nodes[output.nodeName] === undefined) {
            throw new Error('Undefined node ' + output.nodeName);
        }
        this.nodes[output.nodeName].connect(output.outputName, node);
    }, this);
};

Network.prototype.digest = function (stream) {
    stream = stream || {};
    if (!(stream instanceof Stream)) {
        stream = new Stream(stream);
    }
    stream.$increase();
    this.nodes.begin.digest(stream);
};

module.exports = Network;
