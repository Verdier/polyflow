'use strict';

var util = require('util');

module.exports = function (polyflow) {

    var Builder = function (build) {
        this.build = build;
    };

    Builder.prototype.$initialize = function (source) {
        this.source = source;
    };

    Builder.prototype.as = function (value, key) {
        return this.build({
            inputs: {
                src: this.source,
            },
            outputs: {
                out: {
                    value: value || null,
                    key: key || null
                }
            }
        });
    };

    polyflow.nano('core.forEach', {
        shortcut: 'forEach',
        Builder: Builder,

        inputs: ['src'],
        outputs: {
            out: {
                subflow: true,
                args: ['value', 'key']
            },
            $finished: []
        },
        allowMultipleOutputs: true,

        fn: function ($inputs, $outputs, $flow) {
            var keys = Object.keys($inputs.src);

            if (keys.length === 0) {
                $outputs.$finished();
                $outputs.$done();
            }

            var counter = keys.length;
            keys.forEach(function (key) {
                var subflow = $flow.$createSubflow();
                subflow.$on('die', function (flow) {
                    --counter;
                    if (counter === 0) {
                        $outputs.$finished();
                        $outputs.$done();
                    }
                });
                $outputs.out(subflow, $inputs.src[key], key);
            });
        }
    });

};
