'use strict';

var parser = require('./modules/parser.js');
var outputHandler = require('./modules/outputHandler.js');

var Node = function (polyflow, nano, binder) {
    this.polyflow = polyflow;
    this.nano = nano;
    this.binder = binder || {};

    this.extractor = null;
    this.injectors = null;

    this.connexions = {};

    this.inputsDefined = false;
    this.outputsDefined = false;

    if (nano.inputs !== null) {
        this.inputsDefined = true;
        this.inputs = nano.inputs;
        this.extractor = parser.makeExtractor(nano.inputs, this.binder);
    }
    if (nano.outputs !== null) {
        this.outputsDefined = true;
        this.outputs = nano.outputs;
        this.injectors = {};
        Object.keys(nano.outputs).forEach(function (outputName) {
            this.connexions[outputName] = [];
            var output = nano.outputs[outputName];
            this.injectors[outputName] = parser.makeInjector(output.args || output, this.binder);
        }, this);
        this.OutputHandler = outputHandler.makeOutputHandlerConstructor(nano.outputs);
    }

    this.fn = nano.fn;
};

Node.prototype.connect = function (outputName, node) {
    if (this.connexions[outputName] === undefined) {
        throw new Error('Ouput ' + outputName + ' on component ' + this.nano.name + ' is not defined');
    }
    this.connexions[outputName].push(node);
};

Node.prototype.digest = function (flow) {

    if (this.inputsDefined && this.fn.$$inputsIndex !== -1) {
        /* Extract inputs from flow */
        var inputs = this.extractor.extract(flow);
        this.fn.$injects[this.fn.$$inputsIndex] = inputs;
    }

    if (this.outputsDefined && this.fn.$$outputsIndex !== -1) {
        /* Make output handler */
        var outputHandler = this._handleOutput.bind(this);
        var doneHandler = this._handleDone.bind(this);
        var outputs = new this.OutputHandler(flow, {
            onOutputCalled: outputHandler,
            onDone: doneHandler,
            allowMultipleOutputs: this.nano.allowMultipleOutputs
        });
        this.fn.$injects[this.fn.$$outputsIndex] = outputs;
    }

    if (this.fn.$$flowIndex !== -1) {
        this.fn.$injects[this.fn.$$flowIndex] = flow;
    }

    this.fn.apply(null, this.fn.$injects);

    if (!this.outputsDefined) {
        flow.$decrease();
    }
};

Node.prototype._handleOutput = function (flow, outputName, values) {
    var injector = this.injectors[outputName];
    injector.inject(values, flow);

    /* Call next nodes */
    this.connexions[outputName].forEach(function (node) {
        flow.$increase();
        process.nextTick(function () {
            node.digest(flow);
        });
    });
};

Node.prototype._handleDone = function (flow) {
    flow.$decrease();
};

/* DOT */

Node.maxDotId = 0;

Node.prototype.getDotId = function () {
    this.dotId = this.dotId || ++Node.maxDotId;
    return this.dotId;
};

Node.prototype.toDot = function (subgraph) {
    var dot = '';
    
    /* Caption */
    var caption;
    if (this.name.indexOf('$$anonymous_') === 0) {
        caption = this.nano.name;
    } else {
        caption = this.name + '\n(' + this.nano.name + ')';
    }

    /* Outputs */
    var outputs = Object.keys(this.connexions).map(function (output) {
        return '<' + output + '>' + output;
    }).join('|');

    /* Definition */
    dot += this.parent.getDotBeforeContent();
    dot += '"' + this.getDotId() + '"' +
        ' [label="{{input}|{' + caption + '}|{' + outputs + '}}"];\n';
    dot += this.parent.getDotAfterContent();

    /* Connexions */
    Object.keys(this.connexions).forEach(function (outputName) {
        this.connexions[outputName].forEach(function (node) {
            dot += node.parent.getDotBeforeContent();
            dot += '"' + this.getDotId() + '":' + outputName + ' -> "' + node.getDotId() + '";\n';
            dot += node.parent.getDotAfterContent();
        }, this);
    }, this);

    /* Next nodes */
    Object.keys(this.connexions).forEach(function (outputName) {
        this.connexions[outputName].forEach(function (node) {
           dot += node.toDot(subgraph);
        });
    }, this);
    
    return dot;
};


module.exports = Node;
