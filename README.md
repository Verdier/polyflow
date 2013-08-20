# PolyFlow #
PolyFlow is a flow-based programming framework.

## Nano ##
A `nano` is an elementary component of a `graph`.

```javascript
var param = {
    inputs: ['in1', 'in2'],
	outputs: {
		out: ['out1'], /* standard output */
        other: ['out1', 'out2']
		err: ['error']
	}
}

polyflow.nano('nano1', param, function ($inputs, $outputs) {
    if (/*condition*/) {
	    $outputs.out($inputs.in1 + $inputs.in2);
    } else if (/* condition */) {
        $outputs.other($inputs.in1, $inputs.in2)
    } else {
        $outputs.err(new Error('error'));
    }
});
```

## Graph ##
A `graph` define a workflow.

```javascript
var graph = polyflow.graph('graph');

graph.begin()
    .then('nano1', 'A') /* named node */
    .then('nano2')
    .then('nano3')
    .label('B')
    .then('nano6');
    
graph.select('A').on('other')
    .then('nano4')
    .then('nano5')
    .then('B');
    
graph.select('A').on('err')
    .then(function ($flow) {
        console.log($flow.error);
    });
    
var network = graph.compile();
network.digest({
    in1: 1,
    in2: 2
});
```

## Service ##
PolyFlow has a dependency injection system which allows `nano` and/or `service` to depend on other `services`.

```javascript
polyflow.service('service1', function () {
    return /* the service */;
});

polyflow.service('service2', function (service1) {
    return /* the service */;
});

polyflow.nano('nano1', param, function ($inputs, service2) {
    /* ... */
});
```