# PolyFlow #
PolyFlow is a flow-based programming framework. It is made to be highly asynchronous.

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
    if (/* condition */) {
	    $outputs.out($inputs.in1 + $inputs.in2);
    } else if (/* condition */) {
        $outputs.other($inputs.in1, $inputs.in2)
    } else {
        $outputs.err(new Error('error'));
    }
});
```

## Graph ##
A `graph` defines a workflow.

```javascript
var graph = polyflow.graph('graph');

graph.begin()
    .then('nano1', 'A') /* named node */
    .then('nano2')
    .then('nano3')
    .label('B')
    .then('nano6');
    /* ... */
    
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

## Binder ##
The *inputs*/*outputs* of a `nano` could be bound to something in the flow, or to a constant value. For example:

```javascript
var graph = polyflow.graph('graph');

graph.begin()
    .then('nano1', 'A') /* named node */
    .then('nano2')
    /* ... */
    
graph.select('A')
    .bind.input('in1').to('obj1')
    .bind.input('in2').to([1, 2, 3])
    .bind.output('out', 'out1').to('obj1.field')
    /* ... */
    
var network = graph.compile();
network.digest({
    obj1: 1
});
```

## Shortcut ##
A `nano` could defined a *shortcut*. Shortcuts are used to define a graph. For example:

```javascript
var graph = polyflow.graph('graph');

graph.begin()
    .set([]).in('values')
    .forEach([1, 2, 3]).as('value')
    .append('value').to('values')
    .end()
    .then(function ($flow) {
        console.log($flow.values);
    });
    
var network = graph.compile();
network.digest();
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