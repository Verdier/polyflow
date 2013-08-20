'use strict';

var util = require('util');

var outputHandler = {};

outputHandler.makeOutputHandlerConstructor = function (outputs) {

    var OutputHandler = function (stream, param) {
        this.$$stream = stream;
        this.$$param = param;

        this.$$allowMultiple = param.allowMultipleOutputs;
        this.$$isDone = false;
        this.$$counter = 0;
    };

    OutputHandler.prototype.$done = function () {
        if (this.$$isDone) {
            throw new Error('Already done');
        }
        this.$$isDone = true;
        this.$$param.onDone(this.$$stream);
    };

    Object.keys(outputs).forEach(function (outputName) {

        var output = outputs[outputName],
            substream,
            args;

        if (util.isArray(output)) {
            args = output;
        } else {
            substream = output.substream;
            args = output.args;
        }

        substream = substream || false;
        args = args || [];

        var nullArgCount = 0;
        args.forEach(function (arg) {
            if (arg === null) {
                ++nullArgCount;
            }
        });

        /* Make output function handler */
        OutputHandler.prototype[outputName] = function () {
            var argsCount = args.length + (substream ? 1 : 0) - nullArgCount;
            if (arguments.length !== argsCount) {
                throw new Error('Bad number of parameters');
            }
            if (!this.$$allowMultiple && this.$$counter > 0) {
                throw new Error('Multiple outputs not allowed');
            }

            var values = {};
            var inc = (substream ? 1 : 0);
            for (var i = 0; i < arguments.length; ++i) {
                if (args[i] !== null) {
                    values[args[i]] = arguments[i + inc];
                }
            }

            var stream;
            if (substream) {
                stream = arguments[0];
            } else {
                stream = this.$$stream;
            }

            this.$$param.onOutputCalled(stream, outputName, values);
            ++this.$$counter;

            if (!this.$$allowMultiple) {
                this.$done();
            }
        };

    });

    return OutputHandler;
};

module.exports = outputHandler;
