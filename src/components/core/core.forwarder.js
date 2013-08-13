'use strict';

module.exports = function (tasker) {

    var param = {
        outputs: {
            out: []
        }
    };

    tasker.nano('core.forwarder', param, function ($outputs) {
        $outputs.out();
    });

};
