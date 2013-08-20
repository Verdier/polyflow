'use strict';

var clone = function (obj) {
    // Handle the 3 simple types, and null or undefined
    if (null === obj || "object" !== typeof obj) {
        return obj;
    }

    var copy;

    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    if (obj instanceof Array) {
        copy = [];
        obj.forEach(function (item, index) {
            copy[index] = clone(item);
        });
        return copy;
    }

    if (obj instanceof Object) {
        copy = {};
        Object.keys(obj).forEach(function (key) {
            copy[key] = clone(obj[key]);
        });
        return copy;
    }

    throw new Error("Unable to copy obj");
};

module.exports = clone;
