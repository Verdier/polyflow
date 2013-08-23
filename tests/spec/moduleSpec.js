'use strict';

var clone = require('../../src/modules/clone.js');
var parser = require('../../src/modules/parser.js');

describe('The module', function () {
    var polyflow = require('../../src/polyflow');

    describe('clone', function () {

        it('should clone an object', function () {
            var obj = {
                a: {
                    b: 'c'
                },
                d: 'e',
                f: ['g', 'h', {
                    i: 'j'
                }]
            };
            var cloneObj = clone(obj);

            expect(cloneObj).not.toBe(obj);
            expect(cloneObj).toEqual(obj);
        });

    });

    describe('parser', function () {

        it('should extract data', function () {
            var innerObj = {
                b: 'stream.a.b',
                c: {
                    d: 'stream.a.c.d'
                }
            };
            var obj = {
                a: innerObj
            };

            var extractor1 = parser.makeExtractor('a'),
                extractor2 = parser.makeExtractor('a.b'),
                extractor3 = parser.makeExtractor('a.c.d'),
                extractor4 = parser.makeExtractor('"a.b"'),
                extractor5 = parser.makeExtractor(obj);

            expect(extractor1.$inputs).toEqual(['a']);
            expect(extractor2.$inputs).toEqual(['a']);
            expect(extractor3.$inputs).toEqual(['a']);
            expect(extractor4.$inputs).toEqual([]);
            expect(extractor5.$inputs).toEqual([]);

            var flow = new polyflow.Flow(obj);
            var subflow = flow.$createSubflow();

            expect(extractor1.extract(subflow)).toBe(innerObj);
            expect(extractor2.extract(subflow)).toBe('stream.a.b');
            expect(extractor3.extract(subflow)).toBe('stream.a.c.d');
            expect(extractor4.extract(subflow)).toBe('a.b');
            expect(extractor5.extract(subflow)).not.toBe(obj);
            expect(extractor5.extract(subflow)).toEqual(obj);
        });

        it('should inject data', function () {
            var obj = {
                b: null,
                c: {
                    d: null
                }
            };

            var injector1 = parser.makeInjector('a'),
                injector2 = parser.makeInjector('a.b'),
                injector3 = parser.makeInjector('a.c.d'),
                injector4 = parser.makeInjector(null);

            expect(injector1.$inputs).toEqual([]);
            expect(injector1.$outputs).toEqual(['a']);

            expect(injector2.$inputs).toEqual(['a']);
            expect(injector2.$outputs).toEqual([]);

            expect(injector3.$inputs).toEqual(['a']);
            expect(injector3.$outputs).toEqual([]);

            expect(injector4.$inputs).toEqual([]);
            expect(injector4.$outputs).toEqual([]);

            var flow = new polyflow.Flow(obj);

            injector1.inject(obj, flow);
            expect(flow.a).toBe(obj);

            injector2.inject('a.b', flow);
            expect(flow.a.b).toBe('a.b');

            injector3.inject('a.c.d', flow);
            expect(flow.a.c.d).toBe('a.c.d');

            injector4.inject({}, flow);
            expect(flow['null']).toBeUndefined();
        });

    });

});
