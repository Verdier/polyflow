'use strict';

var util = require('util');
var parser = require('./modules/parser.js');

var Binder = function (graph, param) {
    this.$$graph = graph;
    param = param || {};

    this.$$input_map = param.inputs || {};
    this.$$output_maps = param.outputs || {};
    this.$$computedInputs = [];
    this.$$computedOutputs = [];
    this.$$extractors = {};
    this.$$injectors = {};
    this.$$compiled = false;

    /* Selection */
    this.$$selected_input_argument = null;
    this.$$selected_output_name = null;
    this.$$selected_output_argument = null;
};

Binder.prototype.input = function (argumentName) {
    this.$$selected_input_argument = argumentName;
    this.$$selected_output_name = null;
    this.$$selected_output_argument = null;
    return this;
};

Binder.prototype.output = function (outputName, argumentName) {
    this.$$selected_input_argument = null;
    this.$$selected_output_name = outputName;
    this.$$selected_output_argument = argumentName;
    return this;
};

Binder.prototype.to = function (argument) {
    if (this.$$selected_input_argument !== null) {
        this.$$input_map[this.$$selected_input_argument] = argument;
    } else if (this.$$selected_output_argument !== null) {
        var outputs = this.$$output_maps[this.$$selected_output_name] || {};
        outputs[this.$$selected_output_argument] = argument;
        this.$$output_maps[this.$$selected_output_name] = outputs;
    } else {
        throw new Error('No argument selected');
    }
    this.$$selected_input_argument = null;
    this.$$selected_output_name = null;
    this.$$selected_output_argument = null;
    return this.$$graph;
};

Binder.prototype.$extract = function (flow) {
    var values = {};
    Object.keys(this.$$input_map).forEach(function (argumentName) {
        var extractor = this.$$extractors[argumentName];
        values[argumentName] = extractor.extract(flow);
    }, this);
    return values;
};

Binder.prototype.$inject = function (flow, outputName, values) {
    var output_map = this.$$output_maps[outputName];
    var injectors = this.$$injectors[outputName];
    Object.keys(output_map).forEach(function (argumentName) {
        var injector = injectors[argumentName];
        injector.inject(values[argumentName], flow);
    });
};

Binder.prototype.$compile = function (inputs, outputs) {
    if (this.$$compiled) {
        throw new Error('Binder allready compiled');
    }
    this.$$compiled = true;

    inputs = inputs || [];
    outputs = outputs || {};

    /* Handle outputs */
    Object.keys(outputs).forEach(function (outputName) {
        var outputArgs = outputs[outputName];
        if (!util.isArray(outputArgs)) {
            outputArgs = outputArgs.args || [];
        }
        outputs[outputName] = outputArgs;
    });

    /* Inputs */
    inputs.forEach(function (argumentName) {
        var input = this.$$input_map[argumentName];
        if (input === undefined) {
            input = argumentName;
        }
        this.$$input_map[argumentName] = input;
        var extractor = parser.makeExtractor(input);
        this.$$extractors[argumentName] = extractor;
        this.$$computedInputs = this.$$computedInputs.concat(extractor.$inputs);
    }, this);

    /* Outputs */
    Object.keys(outputs).forEach(function (outputName) {
        var injectors = {};
        var output_map = this.$$output_maps[outputName] || {};
        outputs[outputName].forEach(function (argumentName) {
            var output = output_map[argumentName];
            if (output === undefined) {
                output = argumentName;
            }
            output_map[argumentName] = output;
            var injector = parser.makeInjector(output);
            injectors[argumentName] = injector;
            this.$$computedInputs = this.$$computedInputs.concat(injector.$inputs);
            this.$$computedOutputs = this.$$computedOutputs.concat(injector.$outputs);
        }, this);
        this.$$output_maps[outputName] = output_map;
        this.$$injectors[outputName] = injectors;
    }, this);

    /* Remove duplicats */
    this.$$computedInputs = this.$$computedInputs.filter(function (item, pos, coll) {
        return coll.indexOf(item) === pos;
    });
    this.$$computedOutputs = this.$$computedOutputs.filter(function (item, pos, coll) {
        return coll.indexOf(item) === pos;
    });

    return this;
};

module.exports = Binder;
