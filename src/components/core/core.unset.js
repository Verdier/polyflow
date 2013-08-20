'use strict';

module.exports = function (polyflow) {

    var param = {
        inputs: ['name'],
        outputs: []
    };

    polyflow.nano('core.unset', param, function ($inputs, $outputs, $stream) {
        $stream.$remove($inputs.name);
        $outputs.out();
    });

};
