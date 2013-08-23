'use strict';

describe('The component', function () {
    var polyflow = require('../../src/polyflow');

    describe('core.forwarder', function () {

        it('should forward the flow', function (done) {
            var graph = polyflow.graph('graph');

            graph.begin()
                .then('core.forwarder')
                .then(function () {
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('has label shortcut', function (done) {
            var graph = polyflow.graph('graph');

            graph.begin()
                .label()
                .label('A');

            graph.select('A')
                .then(function () {
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

    });

    describe('core.set', function () {

        it('should inject something in the flow', function (done) {
            var graph = polyflow.graph('graph');
            var array = [1, 2, 3];

            graph.begin()
                .set(array).in('array')
                .set(true).in('bool')
                .set('bool').in('bool2')
                .then(function ($flow) {
                    expect($flow.array).toEqual([1, 2, 3]);
                    expect($flow.array).not.toBe(array);
                    expect($flow.bool).toBe(true);
                    expect($flow.bool2).toBe(true);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

    });

    describe('core.unset', function () {

        it('should remove something from the flow', function (done) {
            var graph = polyflow.graph('graph');

            graph.begin()
                .unset('array')
                .unset('bool')
                .then(function ($flow) {
                    expect($flow.array).toBeUndefined();
                    expect($flow.bool).toBeUndefined();
                    done();
                });

            var network = graph.compile();
            network.digest({
                array: [1, 2, 3],
                bool: true
            });
        });

    });

    describe('core.forEach', function () {

        it('should loop over an array and set each value into a subflow', function (done) {
            var graph = polyflow.graph('graph');
            var array = [];

            graph.begin()
                .forEach([1, 2, 3]).as('value')
                .then(function ($flow) {
                    array.push($flow.value);
                });

            var flow = new polyflow.Flow();
            flow.$on('die', function (flow) {
                expect(array).toEqual([1, 2, 3]);
                done();
            });

            var network = graph.compile();
            network.digest(flow);
        });

        it('should loop over an object and set each value/key into a subflow', function (done) {
            var graph = polyflow.graph('graph');
            var obj = {};

            graph.begin()
                .set({
                    a: 1,
                    b: 2
                }).in('object')
                .forEach('object').as('value', 'key')
                .then(function ($flow) {
                    obj[$flow.key] = $flow.value;
                })
                .end()
                .then(function () {
                    expect(obj).toEqual({
                        a: 1,
                        b: 2
                    });
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should fire $finished when all subflows are died', function (done) {
            var graph = polyflow.graph('graph');
            var counter = 0;

            graph.begin()
                .forEach([1, 2, 3]).as('value')
                .then(function () {
                    ++counter;
                })
                .end()
                .then(function () {
                    expect(counter).toBe(3);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should loop over an array in the flow', function (done) {
            var graph = polyflow.graph('graph');
            var counter = 0;

            graph.begin()
                .set([1, 2, 3]).in('values')
                .forEach('values').as('value')
                .then(function () {
                    ++counter;
                })
                .end()
                .then(function () {
                    expect(counter).toBe(3);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

    });

    describe('core.append', function () {

        it('should append something to an existing array in the flow', function (done) {
            var graph = polyflow.graph('graph');

            graph.begin()
                .set([]).in('array')
                .append(1).to('array')
                .append(2).to('array')
                .then(function ($flow) {
                    expect($flow.array).toEqual([1, 2]);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should extract a value from the flow', function (done) {
            var graph = polyflow.graph('graph');

            graph.begin()
                .set([]).in('array')
                .set(1).in('v1')
                .set(2).in('v2')
                .append('v1').to('array')
                .append('v2').to('array')
                .then(function ($flow) {
                    expect($flow.array).toEqual([1, 2]);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should work with forEach', function (done) {
            var graph = polyflow.graph('graph');

            graph.begin()
                .set([1, 2, 3]).in('src')
                .set([]).in('dst')
                .forEach('src').as('value')
                .append('value').to('dst')
                .end()
                .then(function ($flow) {
                    expect($flow.dst).toEqual([1, 2, 3]);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

    });

});
