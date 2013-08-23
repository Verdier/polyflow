'use strict';

module.exports = function (polyflow) {

    var Builder = function (build) {
        this.build = build;
    };

    Builder.prototype.$initialize = function (argumentName) {
        return this.build({
            inputs: {
                name: '"' + argumentName + '"'
            }
        });
    };

    polyflow.nano('core.unset', {
        shortcut: 'unset',
        Builder: Builder,

        inputs: ['name'],
        outputs: [],
        fn: function ($inputs, $outputs, $flow) {
            $flow.$remove($inputs.name);
            $outputs.out();
        }
    });

};
