'use strict';

var util = require('util');

var output = {};

output.makeOutputHandlerConstructor = function (outputs) {

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

module.exports = output;