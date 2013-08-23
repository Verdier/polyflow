'use strict';

var Flow = require('./Flow.js');
var Node = require('./Node.js');

var Network = function (polyflow, graph) {
    this.graph = graph;
    this.nodes = {};

    this.name = null;
    this.parent = null;
    this.previous = null;

    /* Compile components */
    Object.keys(graph.nodes).forEach(function (nodeName) {
        var definition = graph.nodes[nodeName];
        var component = polyflow.getComponent(definition.componentName);
        this.nodes[nodeName] = component.compile(definition.binder);
    }, this);

    /* Connect components */
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

Network.prototype.digest = function (flow) {
    flow = flow || {};
    if (!(flow instanceof Flow)) {
        flow = new Flow(flow);
    }
    flow.$increase();
    this.nodes.begin.digest(flow);
};

Network.prototype.finalize = function (parent, nodeName) {
    this.parent = parent;
    this.nodeName = nodeName;
    Object.keys(this.nodes).forEach(function (childNodeName) {
        this.nodes[childNodeName].finalize(this, childNodeName);
    }, this);
};

/* DOT */

Network.maxDotClusterId = 0;

Network.prototype.getDotId = function () {
    return this.nodes.begin.getDotId();
};

Network.prototype.getDotClusterId = function () {
    this.dotClusterId = this.dotClusterId || ++Network.maxDotClusterId;
    return this.dotClusterId;
};

Network.prototype.getDotBeforeContent = function () {
    var subgraph = 'subgraph cluster' + this.getDotClusterId() + '{\n';
    if (this.parent) {
        subgraph = this.parent.getDotBeforeContent() + subgraph;
    }
    return subgraph;
};

Network.prototype.getDotAfterContent = function () {
    var subgraph = '}\n';
    if (this.parent) {
        subgraph += this.parent.getDotAfterContent();
    }
    return subgraph;
};

Network.prototype.toDot = function (subgraph) {
    var dot = '';

    if (!subgraph) {
        dot += 'strict digraph G {\n';
        dot += 'node [shape=record];\n';
    }

    /* Subgraph parameters */
    dot += this.getDotBeforeContent();
    dot += 'label = "' + this.graph.name + '";\n';
    dot += 'style = "dashed";\n';
    dot += this.getDotAfterContent();

    /* Nodes */
    dot += this.nodes.begin.toDot(true);

    if (!subgraph) {
        dot += '}\n';
    }

    return dot;
};

module.exports = Network;
