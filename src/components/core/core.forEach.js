'use strict';

var util = require('util');

module.exports = function (polyflow) {

    var param = {
        inputs: ['src'],
        outputs: {
            out: {
                subflow: true,
                args: ['value', 'key']
            },
            finished: []
        },
        allowMultipleOutputs: true,
    };

    polyflow.nano('core.forEach', param, function ($inputs, $outputs, $flow) {
        var keys = Object.keys($inputs.src);

        if (keys.length === 0) {
            $outputs.finished();
            $outputs.$done();
        }

        var counter = keys.length;
        keys.forEach(function (key) {
            var subflow = $flow.$createSubflow();
            subflow.$on('die', function (flow) {
                --counter;
                if (counter === 0) {
                    $outputs.finished();
                    $outputs.$done();
                }
            });
            $outputs.out(subflow, $inputs.src[key], key);
        });
    });

};
