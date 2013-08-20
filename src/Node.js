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
        throw new Error('Ouput ' + outputName + ' is not defined');
    }
    this.connexions[outputName].push(node);
};

Node.prototype.digest = function (stream) {

    if (this.inputsDefined && this.fn.$$inputsIndex !== -1) {
        /* Extract inputs from stream */
        var inputs = this.extractor.extract(stream);
        this.fn.$injects[this.fn.$$inputsIndex] = inputs;
    }

    if (this.outputsDefined && this.fn.$$outputsIndex !== -1) {
        /* Make output handler */
        var outputHandler = this._handleOutput.bind(this);
        var doneHandler = this._handleDone.bind(this);
        var outputs = new this.OutputHandler(stream, {
            onOutputCalled: outputHandler,
            onDone: doneHandler,
            allowMultipleOutputs: this.nano.allowMultipleOutputs
        });
        this.fn.$injects[this.fn.$$outputsIndex] = outputs;
    }

    if (this.fn.$$streamIndex !== -1) {
        this.fn.$injects[this.fn.$$streamIndex] = stream;
    }

    this.fn.apply(null, this.fn.$injects);

    if (!this.outputsDefined) {
        stream.$decrease();
    }
};

Node.prototype._handleOutput = function (stream, outputName, values) {
    var injector = this.injectors[outputName];
    injector.inject(values, stream);

    /* Call next nodes */
    this.connexions[outputName].forEach(function (node) {
        stream.$increase();
        process.nextTick(function () {
            node.digest(stream);
        });
    });
};

Node.prototype._handleDone = function (stream) {
    stream.$decrease();
};

module.exports = Node;
