'use strict';

module.exports = function (polyflow) {

    var param = {
        inputs: ['name'],
        outputs: []
    };

    polyflow.nano('core.unset', param, function ($inputs, $outputs, $flow) {
        $flow.$remove($inputs.name);
        $outputs.out();
    });

};
