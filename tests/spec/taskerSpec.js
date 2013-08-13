'use strict';

describe('The tasker system', function () {
    var tasker = require('../../src/');

    tasker.nano('nano', {
        outputs: {
            'out': []
        }
    }, function ($outputs) {
        $outputs.out();
    });

    tasker.nano('nano.io', {
        inputs: ['in1'],
        outputs: {
            out: ['out1'],
            out2: ['out2']
        }
    }, function ($inputs, $outputs) {
        if ($inputs.in1 === true) {
            $outputs.out(true);
        } else {
            $outputs.out2(false);
        }
    });

    describe('has basic functionalities which', function () {

        it('should allow to create/retreive nano and graph', function () {
            tasker.nano('nano1', function () {});
            tasker.graph('graph1');

            expect(tasker.getComponent('nano1')).toBeDefined();
            expect(tasker.getComponent('graph1')).toBeDefined();
            expect(function () {
                tasker.getComponent('__nano1');
            }).toThrow();
            expect(function () {
                tasker.getComponent('__graph1');
            }).toThrow();
        });

    });

    describe('has dependecy injection system which', function () {

        tasker.service('service1', function () {
            return {
                run: function (arg) {
                    return arg;
                }
            };
        });

        tasker.service('service2', function (service1) {
            return {
                run: function (arg) {
                    return service1.run(arg);
                }
            };
        });

        tasker.service('service3', function (service2) {
            return {
                run: function (arg) {
                    return service2.run(arg);
                }
            };
        });

        tasker.service('service4', function (service1, service2, service3) {
            return {
                run: function (arg) {
                    return service1.run(arg) && service2.run(arg) && service3.run(arg);
                }
            };
        });

        tasker.service('badService', function (service1, service2, service3, unexistingService) {
            return null;
        });

        tasker.service('badService2', function (service1, badService) {
            return null;
        });

        it('should allow to create/retreive services', function () {
            expect(tasker.$injector.getService('service1')).toBeDefined();
            expect(tasker.$injector.getService('service1').run(true)).toBe(true);
            expect(function () {
                tasker.$injector.getService('__service1');
            }).toThrow();
        });

        it('should inject services in service', function () {
            var service3 = tasker.$injector.getService('service3');
            var service4 = tasker.$injector.getService('service4');
            expect(service3.run(true)).toBe(true);
            expect(service4.run(true)).toBe(true);
        });

        it('should throw when trying to inject unexisting service', function () {
            expect(function () {
                tasker.getService('badService');
            }).toThrow();
            expect(function () {
                tasker.getService('badService2');
            }).toThrow();
        });

        it('should inject services and special services in nano', function (done) {
            var s1 = tasker.$injector.getService('service1');
            var s2 = tasker.$injector.getService('service2');
            var s3 = tasker.$injector.getService('service3');

            tasker.nano('nano.injects', {
                inputs: ['in1'],
                outputs: {
                    out: ['out'],
                }
            }, function (service1, $inputs, service2, $outputs, service3, $stream) {
                expect(service1).toBe(s1);
                expect(service2).toBe(s2);
                expect(service3).toBe(s3);
                expect($stream instanceof tasker.Stream).toBe(true);
                expect($inputs.in1).toBeDefined();
                expect($outputs.out).toBeDefined();
                done();
            });

            var graph = tasker.graph('graph');

            graph.begin()
                .then('nano.injects');

            var network = graph.compile();
            network.digest({
                in1: true
            });
        });
    });

    describe('has graph which', function () {

        it('should be chainable using then', function (done) {
            var graph = tasker.graph('graph');

            graph.begin()
                .then('nano')
                .then('nano')
                .then(function () {
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should have a select methode', function () {
            var graph = tasker.graph('graph');

            var a = false,
                b = false,
                c = false;

            graph.addNode('nano', 'C')
                .then(function () {
                    expect(a).toBe(true);
                    expect(b).toBe(true);
                    c = true;
                });

            graph.begin()
                .then('nano')
                .then('nano', 'A')
                .then('nano', 'B')
                .then('C');

            graph.select('A')
                .then(function () {
                    a = true;
                    expect(b).toBe(false);
                    expect(c).toBe(false);
                });

            graph.select('B')
                .then(function () {
                    expect(a).toBe(true);
                    b = true;
                    expect(c).toBe(false);
                });

            var network = graph.compile();

            runs(function () {
                network.digest();
            });

            waitsFor(function () {
                return a && b && c;
            }, 'all branches to finilize', 200);

        });

        it('should have an on methode to select an ouput', function () {
            var graph = tasker.graph('graph');

            var a = false,
                b = false;

            graph.begin()
                .then('nano')
                .then('nano.io', 'A');

            graph.select('A')
                .then(function () {
                    a = true;
                });

            graph.select('A').on('out2')
                .then(function () {
                    b = true;
                });

            var network = graph.compile();

            runs(function () {
                network.digest({
                    in1: true
                });
            });

            waitsFor(function () {
                return a;
            }, 'digest 1 to finalize', 200);

            runs(function () {
                expect(a).toBe(true);
                expect(b).toBe(false);

                a = false;
                b = false;
            });

            runs(function () {
                network.digest({
                    in1: false
                });
            });

            waitsFor(function () {
                return b;
            }, 'digest 2 to finalize', 200);

            runs(function () {
                expect(a).toBe(false);
                expect(b).toBe(true);
            });
        });
    });

    describe('has stream which', function () {

        it('should die when the number of instances is 0', function (done) {
            var graph = tasker.graph('graph');

            var a = false,
                b = false;

            graph.begin()
                .then('nano', 'A')
                .then('nano')
                .then(function () {
                    a = true;
                });

            graph.select('A')
                .then('nano')
                .then(function () {
                    b = true;
                });

            var stream = new tasker.Stream();
            stream.$on('die', function (stream) {
                expect(a).toBe(true);
                expect(b).toBe(true);
                done();
            });

            var network = graph.compile();
            network.digest(stream);
        });

        it('should die only if all substreams are died', function () {
            var stream = new tasker.Stream();
            stream.$increase();

            var substream = stream.$createSubstream();
            substream.$increase();

            stream.$decrease();
            expect(stream.$died).toBe(false);

            substream.$decrease();
            expect(substream.$died).toBe(true);
            expect(stream.$died).toBe(true);
        });

        it('should manage data inheritance', function () {
            var stream = new tasker.Stream();
            var substream = stream.$createSubstream();

            var a = {},
                b = {},
                bb = {};

            stream.a = a;
            stream.b = b;
            substream.b = bb;

            expect(stream.$get('a')).toBe(a);
            expect(stream.$get('b')).toBe(b);

            expect(substream.$get('a')).toBe(a);
            expect(substream.$get('b')).toBe(bb);
        });

    });

    describe('has network which', function () {

        it('should managed inputs/outputs parameters', function (done) {
            var graph = tasker.graph('graph');

            tasker.nano('nano1', {
                inputs: ['in1', 'in2'],
                outputs: {
                    out: ['out1', 'out2']
                }
            }, function ($inputs, $outputs) {
                expect($inputs.in1).toBe('in1');
                expect($inputs.in2).toBe('in2');
                expect($inputs.in3).toBeUndefined();
                $outputs.out('out1', 'out2');
            });

            graph.begin()
                .then('nano')
                .then('nano1')
                .then(function ($stream) {
                    expect($stream.in1).toBe('in1');
                    expect($stream.in2).toBe('in2');
                    expect($stream.in3).toBe('in3');
                    expect($stream.out1).toBe('out1');
                    expect($stream.out2).toBe('out2');
                    done();
                });

            var network = graph.compile();

            network.digest({
                in1: 'in1',
                in2: 'in2',
                in3: 'in3'
            });
        });

    });

    describe('has core components:', function () {

        describe('the core.forwarder component', function () {

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

        describe('the core.set component', function () {

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

        describe('the core.unset component', function () {

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

        describe('the core.forEach component', function () {

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

        describe('the core.append component', function () {

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
});
