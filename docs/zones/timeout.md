@module {function(ms)} can-zone/timeout can-zone/timeout
@parent can-zone.plugins

@signature `timeout(ms)`

Creates a [can-zone.ZoneSpec] that you can use as a plugin for your [can-zone Zone] in order to timeout after a certain length of time (as `ms`).

If the Zone times out it's [can-zone.prototype.run run promise] will be rejected with a [can-zone/timeout.TimeoutError], a special error that also includes the number of milliseconds waited before timing out.

```js
var Zone = require("can-zone");
var timeout = require("can-zone/timeout");

var zone = new Zone({
	plugins: [ timeout(5000) ]
});

zone.run(function(){
	setTimeout(function(){

	}, 10000); // waiting over 5 sec
})
.catch(function(err){
	// Called because we exceeded the timeout.
});
```

@param {Number} ms The number of milliseconds to wait before timing out the [can-zone Zone].

@return {can-zone.ZoneSpec} A ZoneSpec that can be passed as a plugin.

@body

## Use

The timeout zone allows you to specify a timeout for your Zone. If the Zone promise doesn't resolve before timing out, the Zone promise will be rejected by the plugin.

The **timeout** zone is a function that takes a timeout in milliseconds.

The Promise will reject with a special type of Error, a [can-zone/timeout.TimeoutError].

```js
var Zone = require("can-zone");
var timeout = require("can-zone/timeout");
var TimeoutError = timeout.TimeoutError;

var zone = new Zone({
	plugins: [
		timeout(2000)
	]
});

zone.run(function(){

	setTimeout(function(){

	}, 5000);

}).then(null, function(err){

	// err.timeout -> 2000

});
```
