'use strict';

var util = require('util');
var events = require("events");

var Stream = function (data) {
    if (data !== undefined) {
        this.$inject(data);
    }

    this.$parent = null;
    this.$substreams = [];
    this.$died = false;

    this.$$instances = 0;
    this.$$emitter = new events.EventEmitter();
};

Stream.prototype.$$dieIfNeeded = function () {
    if (this.$$instances === 0 && this.$substreams.length === 0) {
        this.$died = true;
        this.$$emitter.emit('die', this);
        this.$$emitter.removeAllListeners();
    }
};

Stream.prototype.$increase = function () {
    ++this.$$instances;
};

Stream.prototype.$decrease = function () {
    --this.$$instances;
    this.$$dieIfNeeded();
};

Stream.prototype.$inject = function (data) {
    Object.keys(data).forEach(function (name) {
        this[name] = data[name];
    }, this);
};

Stream.prototype.$remove = function (names) {
    if (util.isArray(names)) {
        names.forEach(function (name) {
            this[name] = undefined;
        }, this);
    } else {
        this[names] = undefined;
    }
};

Stream.prototype.$on = function (event, listener) {
    this.$$emitter.on(event, listener);
};

Stream.prototype.$get = function (name) {
    var value = this[name];
    if (value === undefined && this.$parent !== null) {
        value = this.$parent.$get(name);
    }
    return value;
};

Stream.prototype.$createSubstream = function () {
    var substream = new Stream();

    substream.$parent = this;
    this.$substreams.push(substream);

    var _this = this;
    substream.$on('die', function (stream) {
        var index = _this.$substreams.indexOf(stream);
        _this.$substreams.splice(index, 1);
        _this.$$dieIfNeeded();
    });

    return substream;
};

module.exports = Stream;
