'use strict';

module.exports = function (polyflow) {

    var Builder = function (build) {
        this.build = build;
    };

    Builder.prototype.$initialize = function (destination, source) {
        return this.build({
            inputs: {
                src: source
            },
            outputs: {
                out: {
                    dst: destination
                }
            }
        });
    };

    polyflow.nano('core.set', {
        shortcut: 'set',
        Builder: Builder,

        inputs: ['src'],
        outputs: ['dst'],
        fn: function ($inputs, $outputs) {
            $outputs.out($inputs.src);
        }
    });

};
