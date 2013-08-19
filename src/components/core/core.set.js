'use strict';

module.exports = function (polyflow) {

    polyflow.nano('core.set', function ($param, $parser) {
        var src = $param.src;
        var dst = $param.dst;

        var extractor = $parser.makeExtractor(src);
        var injector = $parser.makeInjector(dst);

        var inputs = extractor.$inputs.concat(injector.$inputs);
        var outputs = injector.$outputs.concat();

        return {
            inputs: inputs,
            outputs: {
                out: outputs
            },
            fn: function ($outputs, $stream) {
                var value = extractor.extract($stream);
                var out = injector.inject(value, $stream);
                $outputs.out(out);
            }
        };
    });

};
