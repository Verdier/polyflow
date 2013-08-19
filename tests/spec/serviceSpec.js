'use strict';

describe('The service', function () {
    var polyflow = require('../../src/polyflow');

    describe('$clone', function () {
        var $clone = polyflow.$injector.getService('$clone');

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
            var cloneObj = $clone(obj);

            expect(cloneObj).not.toBe(obj);
            expect(cloneObj).toEqual(obj);
        });

    });

    describe('$parser', function () {
        var $parser = polyflow.$injector.getService('$parser');

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

            var extractor1 = $parser.makeExtractor('a'),
                extractor2 = $parser.makeExtractor('a.b'),
                extractor3 = $parser.makeExtractor('a.c.d'),
                extractor4 = $parser.makeExtractor('"a.b"'),
                extractor5 = $parser.makeExtractor(obj);

            expect(extractor1.$inputs).toEqual(['a']);
            expect(extractor2.$inputs).toEqual(['a']);
            expect(extractor3.$inputs).toEqual(['a']);
            expect(extractor4.$inputs).toEqual([]);
            expect(extractor5.$inputs).toEqual([]);

            var stream = new polyflow.Stream(obj);
            var substream = stream.$createSubstream();

            expect(extractor1.extract(stream)).toBe(innerObj);
            expect(extractor2.extract(stream)).toBe('stream.a.b');
            expect(extractor3.extract(stream)).toBe('stream.a.c.d');
            expect(extractor4.extract(stream)).toBe('a.b');
            expect(extractor5.extract(stream)).not.toBe(obj);
            expect(extractor5.extract(stream)).toEqual(obj);
        });

        it('should inject data', function () {
            var obj = {
                b: null,
                c: {
                    d: null
                }
            };

            var injector1 = $parser.makeInjector('a'),
                injector2 = $parser.makeInjector('a.b'),
                injector3 = $parser.makeInjector('a.c.d');

            expect(injector1.$inputs).toEqual([]);
            expect(injector1.$outputs).toEqual(['a']);

            expect(injector2.$inputs).toEqual(['a']);
            expect(injector2.$outputs).toEqual([]);

            expect(injector3.$inputs).toEqual(['a']);
            expect(injector3.$outputs).toEqual([]);

            var out;
            var stream = new polyflow.Stream(obj);

            out = injector1.inject(obj, stream);
            expect(stream.a).toBe(obj);
            expect(out).toBe(obj);

            out = injector2.inject('a.b', stream);
            expect(stream.a.b).toBe('a.b');
            expect(out).toBeUndefined();

            out = injector3.inject('a.c.d', stream);
            expect(stream.a.c.d).toBe('a.c.d');
            expect(out).toBeUndefined();
        });

    });

});
