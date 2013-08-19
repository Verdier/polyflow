'use strict';

module.exports = function (polyflow) {

    var param = {
        outputs: {
            out: []
        }
    };

    polyflow.nano('core.forwarder', param, function ($outputs) {
        $outputs.out();
    });

};
