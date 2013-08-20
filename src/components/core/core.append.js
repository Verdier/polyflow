'use strict';

module.exports = function (polyflow) {

    var param = {
        inputs: ['src', 'dst'],
        outputs: []
    };

    polyflow.nano('core.append', param, function ($inputs, $outputs) {
        $inputs.dst.push($inputs.src);
        $outputs.out();
    });

};
