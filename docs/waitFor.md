@function can-zone.waitFor waitFor
@parent can-zone.static

@signature `Zone.waitFor(fn)`

**Zone.waitFor** is a function that creates a callback that can be used with any async functionality. Calling Zone.waitFor registers a wait with the currently running request and returns a function that, when called, will decrement the wait count.

This is useful if there is async functionality other than what [we implement](#tasks). You might be using a library that has C++ bindings and doesn't go through the normal JavaScript async APIs.

```js
var Zone = require("can-zone");
var fs = require("fs");

fs.readFile("data.json", "utf8", Zone.waitFor(function(){
	// We waited on this!
}));
```

@param {function} fn
