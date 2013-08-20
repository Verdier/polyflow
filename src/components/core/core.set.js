'use strict';

module.exports = function (polyflow) {

    var param = {
        inputs: ['src'],
        outputs: ['dst']
    };

    polyflow.nano('core.set', param, function ($inputs, $outputs) {
        $outputs.out($inputs.src);
    });

};
