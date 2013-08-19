'use strict';

module.exports = function (polyflow) {

    polyflow.nano('core.unset', function ($param) {
        var name = $param.name;

        return {
            outputs: {
                out: {
                    unset: [name]
                }
            },
            fn: function ($outputs) {
                $outputs.out();
            }
        };
    });

};
