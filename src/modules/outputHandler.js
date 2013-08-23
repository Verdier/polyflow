'use strict';

var util = require('util');

var outputHandler = {};

outputHandler.makeOutputHandlerConstructor = function (outputs) {

    var OutputHandler = function (flow, param) {
        this.$$flow = flow;
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
        this.$$param.onDone(this.$$flow);
    };

    Object.keys(outputs).forEach(function (outputName) {

        var subflow,
            args;

        args = outputs[outputName];
        if (!util.isArray(args)) {
            subflow = args.subflow;
            args = args.args;
        }

        subflow = subflow || false;
        args = args || [];

        /* Make output function handler */
        OutputHandler.prototype[outputName] = function () {
            var argsCount = args.length + (subflow ? 1 : 0);
            if (arguments.length !== argsCount) {
                throw new Error('Bad number of parameters');
            }
            if (!this.$$allowMultiple && this.$$counter > 0) {
                throw new Error('Multiple outputs not allowed');
            }

            var values = {};
            var inc = subflow ? 1 : 0;
            for (var i = 0; i < arguments.length; ++i) {
                values[args[i]] = arguments[i + inc];
            }

            var flow = subflow ? arguments[0] : this.$$flow;

            this.$$param.onOutputCalled(flow, outputName, values);
            ++this.$$counter;

            if (!this.$$allowMultiple) {
                this.$done();
            }
        };

    });

    return OutputHandler;
};

module.exports = outputHandler;
