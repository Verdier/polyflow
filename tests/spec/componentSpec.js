'use strict';

describe('The component', function () {
    var tasker = require('../../src/polyflow');

    describe('core.forwarder', function () {

        it('should forward the stream', function (done) {
            var graph = tasker.graph('graph');

            graph.begin()
                .then('core.forwarder')
                .then(function () {
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should be definable in graph using label shortcut', function (done) {
            var graph = tasker.graph('graph');

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

        it('should inject something in the stream', function (done) {
            var graph = tasker.graph('graph');
            var array = [1, 2, 3];

            graph.begin()
                .then('core.set', {
                    name: 'array',
                    value: array
                })
                .then('core.set', {
                    name: 'bool',
                    value: true
                })
                .then(function ($stream) {
                    expect($stream.array).toEqual([1, 2, 3]);
                    expect($stream.array).not.toBe(array);
                    expect($stream.bool).toBe(true);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should be definable in graph using set shortcut', function (done) {
            var graph = tasker.graph('graph');
            var array = [1, 2, 3];

            graph.begin()
                .set('array', array)
                .set('bool', true)
                .then(function ($stream) {
                    expect($stream.array).toEqual([1, 2, 3]);
                    expect($stream.array).not.toBe(array);
                    expect($stream.bool).toBe(true);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

    });

    describe('core.unset', function () {

        it('should remove something from the stream', function (done) {
            var graph = tasker.graph('graph');

            graph.begin()
                .then('core.unset', {
                    name: 'array',
                })
                .then('core.unset', {
                    name: 'bool',
                })
                .then(function ($stream) {
                    expect($stream.array).toBeUndefined();
                    expect($stream.bool).toBeUndefined();
                    done();
                });

            var network = graph.compile();
            network.digest({
                array: [1, 2, 3],
                bool: true
            });
        });

        it('should be definable in graph using unset shortcut', function (done) {
            var graph = tasker.graph('graph');

            graph.begin()
                .unset('array')
                .unset('bool')
                .then(function ($stream) {
                    expect($stream.array).toBeUndefined();
                    expect($stream.bool).toBeUndefined();
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

        it('should loop over an array and set each value onto a substream', function (done) {
            var graph = tasker.graph('graph');
            var array = [];

            graph.begin()
                .then('core.forEach', {
                    source: [1, 2, 3],
                    destination: 'value'
                })
                .then(function ($stream) {
                    array.push($stream.value);
                });

            var stream = new tasker.Stream();
            stream.$on('die', function (stream) {
                expect(array).toEqual([1, 2, 3]);
                done();
            });

            var network = graph.compile();
            network.digest(stream);
        });

        it('should fire finished when all substream are died', function (done) {
            var graph = tasker.graph('graph');
            var counter = 0;

            graph.begin()
                .then('core.forEach', 'A', {
                    source: [1, 2, 3],
                    destination: 'value'
                })
                .then(function () {
                    ++counter;
                });

            graph.select('A').on('finished')
                .then(function () {
                    expect(counter).toBe(3);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should be definable in graph using forEach shortcut', function (done) {
            var graph = tasker.graph('graph');
            var counter = 0;

            graph.begin()
                .forEach([1, 2, 3], 'value', 'A')
                .then(function () {
                    ++counter;
                });

            graph.select('A').on('finished')
                .then(function () {
                    expect(counter).toBe(3);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should extract an array from the stream', function (done) {
            var graph = tasker.graph('graph');
            var counter = 0;

            graph.begin()
                .set('array', [1, 2, 3])
                .forEach('array', 'value', 'A')
                .then(function () {
                    ++counter;
                });

            graph.select('A').on('finished')
                .then(function () {
                    expect(counter).toBe(3);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

    });

    describe('core.append', function () {

        it('should append something to an existing array in the stream', function (done) {
            var graph = tasker.graph('graph');

            graph.begin()
                .set('array', [])
                .then('core.append', {
                    value: 1,
                    destination: 'array'
                })
                .then('core.append', {
                    value: 2,
                    destination: 'array'
                })
                .then(function ($stream) {
                    expect($stream.array).toEqual([1, 2]);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should extract a value from the stream', function (done) {
            var graph = tasker.graph('graph');

            graph.begin()
                .set('array', [])
                .set('v1', 1)
                .set('v2', 2)
                .append('v1', 'array')
                .append('v2', 'array')
                .then(function ($stream) {
                    expect($stream.array).toEqual([1, 2]);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should works with forEach', function (done) {
            var graph = tasker.graph('graph');

            graph.begin()
                .set('src', [1, 2, 3])
                .set('dst', [])
                .forEach('src', 'value', 'A')
                .append('value', 'dst');

            graph.select('A').on('finished')
                .then(function ($stream) {
                    expect($stream.dst).toEqual([1, 2, 3]);
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

    });

});
