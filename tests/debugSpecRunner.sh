#!/bin/bash

for file in "./spec"
do
    node debug ../node_modules/grunt-jasmine-node/node_modules/jasmine-node/bin/jasmine-node $file
done
