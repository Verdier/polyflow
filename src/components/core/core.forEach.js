'use strict';

var util = require('util');

module.exports = function (tasker) {

    tasker.nano('core.forEach', function (param) {
        var source = param.source;
        var destination = param.destination;

        var inputs = [];
        var extractSource = false;
        if (!util.isArray(source)) {
            extractSource = true;
            inputs.push(source);
        }

        param = {
            inputs: inputs,
            outputs: {
                out: {
                    substream: true,
                    set: [destination]
                },
                finished: []
            },
            allowMultipleOutputs: true,
        };

        param.fn = function ($inputs, $outputs, $stream) {
            var array = (extractSource ? $inputs[source] : source);

            if (array.length === 0) {
                $outputs.finished();
                $outputs.$done();
            }

            var counter = array.length;
            array.forEach(function (item) {
                var substream = $stream.$createSubstream();
                substream.$on('die', function (stream) {
                    --counter;
                    if (counter === 0) {
                        $outputs.finished();
                        $outputs.$done();
                    }
                });
                $outputs.out(substream, item);
            });
        };

        return param;
    });

};
