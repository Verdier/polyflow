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
                b: 'flow.a.b',
                c: {
                    d: 'flow.a.c.d'
                }
            };
            var obj = {
                a: innerObj
            };

            var extractor = parser.makeExtractor(['a', 2, 3, 4, 5, 6], {
                2: 'a.b',
                3: 'a.c.d',
                4: '"a.b"',
                5: obj,
                6: null
            });

            expect(extractor.$extractors.a.$inputs).toEqual(['a']);
            expect(extractor.$extractors[2].$inputs).toEqual(['a']);
            expect(extractor.$extractors[3].$inputs).toEqual(['a']);
            expect(extractor.$extractors[4].$inputs).toEqual([]);
            expect(extractor.$extractors[5].$inputs).toEqual([]);
            expect(extractor.$extractors[6].$inputs).toEqual([]);
            expect(extractor.$inputs).toEqual(['a']);

            var flow = new polyflow.Flow(obj);
            var subflow = flow.$createSubflow();

            expect(extractor.$extractors.a.extract(subflow)).toBe(innerObj);
            expect(extractor.$extractors[2].extract(subflow)).toBe('flow.a.b');
            expect(extractor.$extractors[3].extract(subflow)).toBe('flow.a.c.d');
            expect(extractor.$extractors[4].extract(subflow)).toBe('a.b');
            expect(extractor.$extractors[5].extract(subflow)).not.toBe(obj);
            expect(extractor.$extractors[5].extract(subflow)).toEqual(obj);
            expect(extractor.$extractors[6].extract(subflow)).toBe(null);

            var values = extractor.extract(subflow);
            expect(extractor.$extractors.a.extract(subflow)).toEqual(values.a);
            expect(extractor.$extractors[2].extract(subflow)).toEqual(values[2]);
            expect(extractor.$extractors[3].extract(subflow)).toEqual(values[3]);
            expect(extractor.$extractors[4].extract(subflow)).toEqual(values[4]);
            expect(extractor.$extractors[5].extract(subflow)).toEqual(values[5]);
            expect(extractor.$extractors[6].extract(subflow)).toEqual(values[6]);
        });

        it('should inject data', function () {
            var obj = {
                b: null,
                c: {
                    d: null
                }
            };

            var injector = parser.makeInjector(['a', 2, 3], {
                2: 'a.b',
                3: 'a.c.d'
            });

            expect(injector.$injectors.a.$inputs).toEqual([]);
            expect(injector.$injectors.a.$outputs).toEqual(['a']);
            expect(injector.$injectors[2].$inputs).toEqual(['a']);
            expect(injector.$injectors[2].$outputs).toEqual([]);
            expect(injector.$injectors[3].$inputs).toEqual(['a']);
            expect(injector.$injectors[3].$outputs).toEqual([]);
            expect(injector.$inputs).toEqual(['a']);
            expect(injector.$outputs).toEqual(['a']);

            var flow = new polyflow.Flow();

            injector.$injectors.a.inject(obj, flow);
            expect(flow.a).toBe(obj);

            injector.$injectors[2].inject('a.b', flow);
            expect(flow.a.b).toBe('a.b');

            injector.$injectors[3].inject('a.c.d', flow);
            expect(flow.a.c.d).toBe('a.c.d');

            flow = new polyflow.Flow();
            var values = {
                a: obj,
                2: 'a.b',
                3: 'a.c.d'
            };

            injector.inject(values, flow);
            expect(flow.a).toBe(obj);
            expect(flow.a.b).toBe('a.b');
            expect(flow.a.c.d).toBe('a.c.d');
        });

    });

});
