'use strict';

var Flow = require('./Flow.js');
var Node = require('./Node.js');

var Network = function (polyflow, graph) {
    this.graph = graph;
    this.nodes = {};

    Object.keys(graph.nodes).forEach(function (nodeName) {
        var definition = graph.nodes[nodeName];
        var component = polyflow.getComponent(definition.componentName);
        this.nodes[nodeName] = component.compile(definition.binder);
        this.nodes[nodeName].name = nodeName;
        this.nodes[nodeName].network = this;
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

Network.prototype.isNetwork = true;

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

Network.prototype.digest = function (flow) {
    flow = flow || {};
    if (!(flow instanceof Flow)) {
        flow = new Flow(flow);
    }
    flow.$increase();
    this.nodes.begin.digest(flow);
};

/* DOT */

Network.maxDotClusterId = 0;

Network.prototype.getDotId = function () {
    return this.nodes.begin.getDotId();
};

Network.prototype.toDot = function (subgraph) {
    var dot = '';
    if (subgraph) {
        var cluster = 'cluster' + (++Network.maxDotClusterId);
        dot += 'subgraph ' + cluster + ' {\n';
        dot += 'label = "' + this.graph.name + '";\n';
        dot += 'style = "dashed"\n';
        dot += this.nodes.begin.toDot(true);
        dot += '}\n';
    } else {
        dot += 'strict digraph G {\n';
        dot += 'node [shape=record];\n';
        dot += this.nodes.begin.toDot(true);
        dot += '}\n';
    }
    return dot;
};

module.exports = Network;
