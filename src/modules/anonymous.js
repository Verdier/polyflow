'use strict';

var anonymous = {};

anonymous.$$max_id = 0;
anonymous.$$anonymous_prefix = '$$anonymous_';

anonymous.make = function () {
    return anonymous.$$anonymous_prefix + (++anonymous.$$max_id);
};

module.exports = anonymous;
