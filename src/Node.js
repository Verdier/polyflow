'use strict';

var output = require('./modules/output.js');

var Node = function (tasker, nano) {
    this.tasker = tasker;
    this.nano = nano;

    this.inputs = null;
    this.outputs = null;

    this.connexions = {};

    this.inputsDefined = false;
    this.outputsDefined = false;

    if (nano.inputs !== undefined) {
        this.inputsDefined = true;
        this.inputs = nano.inputs;
    }

    if (nano.outputs !== undefined) {
        this.outputsDefined = true;
        Object.keys(nano.outputs).forEach(function (outPort) {
            this.connexions[outPort] = [];
        }, this);
        this.OutputHandler = output.makeOutputHandlerConstructor(nano.outputs);
        this.outputs = nano.outputs;
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
        var inputs = {};
        this.inputs.forEach(function (name) {
            inputs[name] = stream[name];
        });
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

    this.fn.apply(this, this.fn.$injects);

    if (!this.outputsDefined) {
        stream.$decrease();
    }
};

Node.prototype._handleOutput = function (stream, outputName, sets, unsets) {
    /* Inject sets in stream */
    stream.$inject(sets);

    /* Remove unsets from stream */
    stream.$remove(unsets);

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
