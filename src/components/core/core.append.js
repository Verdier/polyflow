'use strict';

module.exports = function (tasker) {

    tasker.nano('core.append', function (param) {
        var value = param.value;
        var destination = param.destination;
        var extractSource = (typeof value === 'string');

        return {
            outputs: {
                out: []
            },
            fn: function ($outputs, $stream) {
                var v = (extractSource ? $stream[value] : value);
                $stream.$get(destination).push(v);
                $outputs.out();
            }
        };
    });

};
