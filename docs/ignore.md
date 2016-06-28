@function can-zone.ignore ignore
@parent can-zone.static

@signature `Zone.ignore(fn)`

Creates a function that, when called, will not track any calls. This might be needed if you are calling code that does unusual things, like using setTimeout recursively indefinitely.

```js
var Zone = require("can-zone");

new Zone().run(function(){
	function recursive(){
		setTimeout(function(){
			recursive();
		}, 20000);
	}

	var fn = Zone.ignore(recursive);

	// This call will not be waited on.
	fn();
});
```

@param {function} fn A function that contains calls to asynchronous functions that are needing to be ignored.

@return {function} A function in which calls to [can-zone.prototype.addWait] and [can-zone.prototype.removeWait] will be ignored, preventing the Zone's promise from remaining unresolved while asynchronous activity continues within.

@body

## Use

**Zone.ignore** is used to prevent a function from being waited on within a Zone. Normally a Zone's calls to functions like `setTimeout` and `XMLHttpRequest` are waited on before the [can-zone.prototype.run run promise] is resolved, but in some cases you might not want to wait on these calls; for example if there is a very long delay or a delay that will not result in rendering to take place.

Provide Zone.ignore a function and it will return a function that can be called in it's place.

```js
var Zone = require("can-zone");

var fn = Zone.ignore(function(){
	// do any asynchronous stuff here
});

fn(); // waits ignored
```
