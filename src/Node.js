'use strict';

var util = require('util');

var makeOutputHandlerConstructor = function (outputs) {

    var OutputHandler = function (stream, param) {
        this.stream = stream;
        this.param = param;

        this.allowMultiple = param.allowMultipleOutputs;
        this.isDone = false;
        this.counter = 0;
    };

    OutputHandler.prototype.$done = function () {
        if (this.isDone) {
            throw new Error('Already done');
        }
        this.isDone = true;
        this.param.onDone(this.stream);
    };

    Object.keys(outputs).forEach(function (outputName) {

        var output = outputs[outputName],
            substream,
            setNames,
            unsetNames;

        if (util.isArray(output)) {
            setNames = output;
        } else {
            if (output.substream !== undefined) {
                substream = output.substream;
            }
            if (output.set !== undefined) {
                setNames = output.set;
            }
            if (output.unset !== undefined) {
                unsetNames = output.unset;
            }
        }

        substream = substream || false;
        setNames = setNames || [];
        unsetNames = unsetNames || [];

        /* Make output function handler */
        OutputHandler.prototype[outputName] = function () {
            var argsCount = setNames.length + (substream ? 1 : 0);
            if (arguments.length !== argsCount) {
                throw new Error('Bad number of parameters');
            }
            if (!this.allowMultiple && this.counter > 0) {
                throw new Error('Multiple outputs not allowed');
            }

            var parameters = {};
            var inc = (substream ? 1 : 0);
            for (var i = 0; i < arguments.length; ++i) {
                parameters[setNames[i]] = arguments[i + inc];
            }

            var stream;
            if (substream) {
                stream = arguments[0];
            } else {
                stream = this.stream;
            }

            this.param.onOutputCalled(stream, outputName, parameters, unsetNames);
            ++this.counter;

            if (!this.allowMultiple) {
                this.$done();
            }
        };

    });

    return OutputHandler;
};


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
        this.OutputHandler = makeOutputHandlerConstructor(nano.outputs);
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
