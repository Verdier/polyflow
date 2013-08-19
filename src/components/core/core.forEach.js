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
        
        var injectValue = false;
        var injectKey = false;
        
        var outputs = [];
        if (typeof destination === 'string') {
            outputs.push(destination);
            injectValue = true;
        } else {
            if(destination.value !== undefined) {
                outputs.push(destination.value);
                injectValue = true;
            }
            if(destination.key !== undefined) {
                outputs.push(destination.key);
                injectKey = true;
            }
        }

        param = {
            inputs: inputs,
            outputs: {
                out: {
                    substream: true,
                    set: outputs
                },
                finished: []
            },
            allowMultipleOutputs: true,
        };

        param.fn = function ($inputs, $outputs, $stream) {
            var obj = (extractSource ? $inputs[source] : source);
            var keys = Object.keys(obj);

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
                var args = [substream];
                if (injectValue) {
                    args.push(obj[key]);
                }
                if (injectKey) {
                    args.push(key);
                }
                $outputs.out.apply($outputs, args);
            });
        };

        return param;
    });

};
