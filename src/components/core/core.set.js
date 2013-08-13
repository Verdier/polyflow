'use strict';

module.exports = function (tasker) {

    var clone = function (obj) {
        // Handle the 3 simple types, and null or undefined
        if (null === obj || "object" !== typeof obj) {
            return obj;
        }

        var copy;

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            obj.forEach(function (item, index) {
                copy[index] = clone(item);
            });
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = clone(obj[attr]);
                }
            }
            return copy;
        }

        throw new Error("Unable to copy obj");
    };

    tasker.nano('core.set', function (param) {
        var name = param.name;
        var value = param.value;

        return {
            outputs: {
                out: [name]
            },
            fn: function ($outputs) {
                var newValue = clone(value);
                $outputs.out(newValue);
            }
        };
    });

};
