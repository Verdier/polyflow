'use strict';

module.exports = function (polyflow) {

    var Builder = function (build) {
        this.build = build;
    };

    Builder.prototype.$initialize = function () {
        return this.build();
    };

    polyflow.nano('core.end', {
        shortcut: 'end',
        Builder: Builder,

        outputs: [],
        fn: function ($outputs) {
            $outputs.out();
        },

        connectPrevious: function (node, previous, outputName) {
            if (outputName !== '$finished') {
                node.$$previous = previous;
                return false;
            }
            return true;
        },
        finalize: function (network, node) {
            var previous = node.$$previous;
            var endCount = 0;
            var connected = false;
            while (previous !== null) {
                if (previous.nano !== undefined && previous.nano.outputs !== null && previous.nano.outputs.$finished !== undefined) {
                    if (endCount === 0) {
                        previous.connect('$finished', node);
                        connected = true;
                        break;
                    }
                    --endCount;
                }
                if (previous.nano !== undefined && previous.nano.name === 'core.end') {
                    ++endCount;
                }
                previous = previous.previous;
            }
            if (!connected) {
                throw new Error('Component core.end encountered the beginning of the network');
            }
        }
    });

};
