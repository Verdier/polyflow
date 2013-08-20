'use strict';

var util = require('util');
var events = require("events");

var Flow = function (data) {
    if (data !== undefined) {
        this.$inject(data);
    }

    this.$parent = null;
    this.$subflows = [];
    this.$died = false;

    this.$$instances = 0;
    this.$$emitter = new events.EventEmitter();
};

Flow.prototype.$$dieIfNeeded = function () {
    if (this.$$instances === 0 && this.$subflows.length === 0) {
        this.$died = true;
        this.$$emitter.emit('die', this);
        this.$$emitter.removeAllListeners();
    }
};

Flow.prototype.$increase = function () {
    ++this.$$instances;
};

Flow.prototype.$decrease = function () {
    --this.$$instances;
    this.$$dieIfNeeded();
};

Flow.prototype.$inject = function (data) {
    Object.keys(data).forEach(function (name) {
        this[name] = data[name];
    }, this);
};

Flow.prototype.$remove = function (names) {
    if (util.isArray(names)) {
        names.forEach(function (name) {
            this[name] = undefined;
        }, this);
    } else {
        this[names] = undefined;
    }
};

Flow.prototype.$on = function (event, listener) {
    this.$$emitter.on(event, listener);
};

Flow.prototype.$get = function (name) {
    var value = this[name];
    if (value === undefined && this.$parent !== null) {
        value = this.$parent.$get(name);
    }
    return value;
};

Flow.prototype.$createSubflow = function () {
    var subflow = new Flow();

    subflow.$parent = this;
    this.$subflows.push(subflow);

    var _this = this;
    subflow.$on('die', function (stream) {
        var index = _this.$subflows.indexOf(stream);
        _this.$subflows.splice(index, 1);
        _this.$$dieIfNeeded();
    });

    return subflow;
};

module.exports = Flow;
