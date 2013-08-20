'use strict';

var max_id = 0;
var anonymous_prefix = '$$anonymous_';

var anonymous = {};

anonymous.make = function () {
    return anonymous_prefix + (++max_id);
};

module.exports = anonymous;
