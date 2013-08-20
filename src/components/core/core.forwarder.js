'use strict';

module.exports = function (polyflow) {

    var param = {
        outputs: []
    };

    polyflow.nano('core.forwarder', param, function ($outputs) {
        $outputs.out();
    });

};
