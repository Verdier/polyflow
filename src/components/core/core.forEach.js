'use strict';

var util = require('util');

module.exports = function (polyflow) {

    var param = {
        inputs: ['src'],
        outputs: {
            out: {
                substream: true,
                args: ['value', 'key']
            },
            finished: []
        },
        allowMultipleOutputs: true,
    };

    polyflow.nano('core.forEach', param, function ($inputs, $outputs, $stream) {
        var keys = Object.keys($inputs.src);

        if (keys.length === 0) {
            $outputs.finished();
            $outputs.$done();
        }

        var counter = keys.length;
        keys.forEach(function (key) {
            var substream = $stream.$createSubstream();
            substream.$on('die', function (stream) {
                --counter;
                if (counter === 0) {
                    $outputs.finished();
                    $outputs.$done();
                }
            });
            $outputs.out(substream, $inputs.src[key], key);
        });
    });

};
