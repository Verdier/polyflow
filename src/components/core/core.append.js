'use strict';

module.exports = function (polyflow) {

    var Builder = function (build) {
        this.build = build;
    };

    Builder.prototype.$initialize = function (source) {
        this.source = source;
    };

    Builder.prototype.to = function (destination) {
        return this.build({
            inputs: {
                src: this.source,
                dst: destination
            }
        });
    };

    polyflow.nano('core.append', {
        shortcut: 'append',
        Builder: Builder,

        inputs: ['src', 'dst'],
        outputs: [],
        fn: function ($inputs, $outputs) {
            $inputs.dst.push($inputs.src);
            $outputs.out();
        }
    });

};
