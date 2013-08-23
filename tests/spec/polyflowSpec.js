'use strict';

describe('PolyFlow', function () {
    var polyflow = require('../../src/polyflow');

    polyflow.nano('nano', {
        outputs: {
            'out': []
        }
    }, function ($outputs) {
        $outputs.out();
    });

    polyflow.nano('nano.io', {
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

    describe('basic functionalities', function () {

        it('should allow to create/retreive nano and graph', function () {
            polyflow.nano('nano1', function () {});
            polyflow.graph('graph1');

            expect(polyflow.getComponent('nano1')).toBeDefined();
            expect(polyflow.getComponent('graph1')).toBeDefined();
            expect(function () {
                polyflow.getComponent('__nano1');
            }).toThrow();
            expect(function () {
                polyflow.getComponent('__graph1');
            }).toThrow();
        });

    });

    describe('dependecy injection system', function () {

        polyflow.service('service1', function () {
            return {
                run: function (arg) {
                    return arg;
                }
            };
        });

        polyflow.service('service2', function (service1) {
            return {
                run: function (arg) {
                    return service1.run(arg);
                }
            };
        });

        polyflow.service('service3', function (service2) {
            return {
                run: function (arg) {
                    return service2.run(arg);
                }
            };
        });

        polyflow.service('service4', function (service1, service2, service3) {
            return {
                run: function (arg) {
                    return service1.run(arg) && service2.run(arg) && service3.run(arg);
                }
            };
        });

        polyflow.service('badService', function (service1, service2, service3, unexistingService) {
            return null;
        });

        polyflow.service('badService2', function (service1, badService) {
            return null;
        });

        it('should allow to create/retreive services', function () {
            expect(polyflow.$injector.getService('service1')).toBeDefined();
            expect(polyflow.$injector.getService('service1').run(true)).toBe(true);
            expect(function () {
                polyflow.$injector.getService('__service1');
            }).toThrow();
        });

        it('should inject services in service', function () {
            var service3 = polyflow.$injector.getService('service3');
            var service4 = polyflow.$injector.getService('service4');
            expect(service3.run(true)).toBe(true);
            expect(service4.run(true)).toBe(true);
        });

        it('should throw when trying to inject unexisting service', function () {
            expect(function () {
                polyflow.getService('badService');
            }).toThrow();
            expect(function () {
                polyflow.getService('badService2');
            }).toThrow();
        });

        it('should inject services and special services in nano', function (done) {
            var s1 = polyflow.$injector.getService('service1');
            var s2 = polyflow.$injector.getService('service2');
            var s3 = polyflow.$injector.getService('service3');

            polyflow.nano('nano.injects', {
                inputs: ['in1'],
                outputs: {
                    out: ['out'],
                }
            }, function (service1, $inputs, service2, $outputs, service3, $flow) {
                expect(service1).toBe(s1);
                expect(service2).toBe(s2);
                expect(service3).toBe(s3);
                expect($flow instanceof polyflow.Flow).toBe(true);
                expect($inputs.in1).toBeDefined();
                expect($outputs.out).toBeDefined();
                done();
            });

            var graph = polyflow.graph('graph');

            graph.begin()
                .then('nano.injects');

            var network = graph.compile();
            network.digest({
                in1: true
            });
        });
    });

    describe('binder', function () {
        var Binder = require('../../src/Binder.js');

        /* TODO */
    });

    describe('graph', function () {

        it('should be chainable using then', function (done) {
            var graph = polyflow.graph('graph');

            graph.begin()
                .then('nano')
                .then('nano')
                .then(function () {
                    done();
                });

            var network = graph.compile();
            network.digest();
        });

        it('should has a select methode', function () {
            var graph = polyflow.graph('graph');

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

        it('should has an on methode to select an ouput', function () {
            var graph = polyflow.graph('graph');

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

        it('should be connectable', function () {
            var a = false,
                b = false,
                graph1 = polyflow.graph('graph1'),
                graph2 = polyflow.graph('graph2');

            graph1.begin()
                .then('nano.io', 'io')
                .output('out');

            graph1.select('io').on('out2')
                .output('out2');

            graph2.begin()
                .then('graph1', 'g1')
                .then(function () {
                    a = true;
                });

            graph2.select('g1').on('out2')
                .then(function () {
                    b = true;
                });

            var network = graph2.compile();

            runs(function () {
                network.digest({
                    in1: true
                });
                network.digest({
                    in1: false
                });
            });

            waitsFor(function () {
                return a && b;
            }, 'all branches to finilize', 200);

        });

        it('should allow to bind inputs/outputs', function () {
            var a = false,
                b = false,
                graph = polyflow.graph('graph');

            graph.begin()
                .then('nano.io', 'io')
                .then(function ($flow) {
                    expect($flow.out11).toBe(true);
                    a = true;
                });

            graph.select('io').on('out2')
                .then(function ($flow) {
                    expect($flow.out22).toBe(false);
                    b = true;
                });

            graph.select('io')
                .bind.input('in1').to('in11')
                .bind.output('out', 'out1').to('out11')
                .bind.output('out2', 'out2').to('out22');

            var network = graph.compile();

            runs(function () {
                network.digest({
                    in11: true
                });
                network.digest({
                    in11: false
                });
            });

            waitsFor(function () {
                return a && b;
            }, 'all branches to finilize', 200);
        });

        it('should allow to ignore an output', function (done) {
            var graph = polyflow.graph('graph');

            graph.begin()
                .then('nano.io', 'io')
                .bind.output('out', 'out1').to(null)
                .then(function ($flow) {
                    expect($flow.out1).toBeUndefined();
                    done();
                });

            var network = graph.compile();
            network.digest({
                in1: true
            });

        });
    });

    describe('flow', function () {

        it('should die when the number of instances is 0', function (done) {
            var graph = polyflow.graph('graph');

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

            var flow = new polyflow.Flow();
            flow.$on('die', function (flow) {
                expect(a).toBe(true);
                expect(b).toBe(true);
                done();
            });

            var network = graph.compile();
            network.digest(flow);
        });

        it('should die only if all subflows are died', function () {
            var flow = new polyflow.Flow();
            flow.$increase();

            var subflow = flow.$createSubflow();
            subflow.$increase();

            flow.$decrease();
            expect(flow.$died).toBe(false);

            subflow.$decrease();
            expect(subflow.$died).toBe(true);
            expect(flow.$died).toBe(true);
        });

        it('should manage data inheritance', function () {
            var flow = new polyflow.Flow();
            var subflow = flow.$createSubflow();

            var a = {},
                b = {},
                bb = {};

            flow.a = a;
            flow.b = b;
            subflow.b = bb;

            expect(flow.$get('a')).toBe(a);
            expect(flow.$get('b')).toBe(b);

            expect(subflow.$get('a')).toBe(a);
            expect(subflow.$get('b')).toBe(bb);
        });

    });

    describe('network', function () {

        it('should managed inputs/outputs parameters', function (done) {
            var graph = polyflow.graph('graph');

            polyflow.nano('nano1', {
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
                .then(function ($flow) {
                    expect($flow.in1).toBe('in1');
                    expect($flow.in2).toBe('in2');
                    expect($flow.in3).toBe('in3');
                    expect($flow.out1).toBe('out1');
                    expect($flow.out2).toBe('out2');
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

});
