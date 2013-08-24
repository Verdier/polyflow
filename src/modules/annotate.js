'use strict';

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

var annotate = function (fn) {
    if (fn.$arguments !== undefined) {
        return fn.$arguments;
    }

    var $arguments = [];
    var fnText = fn.toString().replace(STRIP_COMMENTS, '');
    var argDecl = fnText.match(FN_ARGS);
    if (argDecl === null) {
            debugger;
    }
    argDecl[1].split(FN_ARG_SPLIT).forEach(function (arg) {
        arg.replace(FN_ARG, function (all, underscore, name) {
            $arguments.push(name);
        });
    });

    fn.$arguments = $arguments;
    return $arguments;
};

module.exports = annotate;
