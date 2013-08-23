'use strict';

module.exports = function (polyflow) {

    var Builder = function (build) {
        this.build = build;
    };

    Builder.prototype.$initialize = function (nodeName) {
        return this.build(nodeName);
    };

    polyflow.nano('core.forwarder', {
        shortcut: 'label',
        Builder: Builder,

        outputs: [],
        fn: function ($outputs) {
            $outputs.out();
        }
    });

};
