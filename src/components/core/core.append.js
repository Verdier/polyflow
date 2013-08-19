'use strict';

module.exports = function (polyflow) {

    polyflow.nano('core.append', function ($param, $parser) {
        var src = $param.src;
        var dst = $param.dst;

        var srcExtractor = $parser.makeExtractor(src);
        var dstExtractor = $parser.makeExtractor(dst);

        var inputs = srcExtractor.$inputs.concat(dstExtractor.$inputs);

        return {
            inputs: inputs,
            outputs: {
                out: []
            },
            fn: function ($outputs, $stream) {
                var value = srcExtractor.extract($stream);
                var array = dstExtractor.extract($stream);
                array.push(value);
                $outputs.out();
            }
        };
    });

};
