'use strict';

var util = require('util');

module.exports = function (polyflow) {

    polyflow.nano('core.forEach', function ($param, $parser) {
        var src = $param.src;
        var dst = $param.dst;

        var inputs = [];
        var outputs = [];

        var extractor = $parser.makeExtractor(src);
        inputs = inputs.concat(extractor.$inputs);

        var valueInjector = null;
        var keyInjector = null;

        if (typeof dst === 'string') {
            valueInjector = $parser.makeInjector(dst);
        } else {
            if (dst.value !== undefined) {
                valueInjector = $parser.makeInjector(dst.value);
            }
            if (dst.key !== undefined) {
                keyInjector = $parser.makeInjector(dst.key);
            }
        }

        if (valueInjector !== null) {
            inputs = inputs.concat(valueInjector.$inputs);
            outputs = outputs.concat(valueInjector.$outputs);
        }
        if (keyInjector !== null) {
            inputs = inputs.concat(keyInjector.$inputs);
            outputs = outputs.concat(keyInjector.$outputs);
        }

        var param = {
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
            var obj = extractor.extract($stream);
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
                var out,
                    args = [substream];
                if (valueInjector !== null) {
                    out = valueInjector.inject(obj[key], $stream);
                    if (out) {
                        args.push(out);
                    }
                }
                if (keyInjector !== null) {
                    out = keyInjector.inject(key, $stream);
                    if (out) {
                        args.push(out);
                    }
                }
                $outputs.out.apply($outputs, args);
            });
        };

        return param;
    });

};
