# can-zone/debug

The **debug** zone gives you information about which tasks failed to complete in case of a timeout. It is to be used with [./timeout.md](can-zone/timeout).

When a timeout occurs the debug Zone will appending debug information to the Zone's [data](https://github.com/canjs/can-zone/blob/master/docs/data.md) property, which can be retrieved when the Zone's promise is rejected:

```js
var debug = require("can-zone/debug");
var Zone = require("can-zone");

var zone = new Zone(debug(5000);

zone.run(function(){

	setTimeout(function(){}, 10000);

}).catch(err){

	var debugInfo = zone.data.debugInfo;

});

```

## DebugInfo

The **DebugInfo** is an array of objects that contain information about which tasks failed to complete. Each object has a shape of:

```js
{
	"task": "setTimeout",
	"stack": Error ...."
}
```

### DebugInfo[].task

A *string* identifier of the task that failed to complete. This can be any of the [asynchronous tasks](https://github.com/canjs/can-zone#tasks) supported by can-zone like `setTimeout` or `Promise`.

### DebugInfo[].stack

A *string* stack trace taken as a snapshot when the task was called. This allows you t see the source of the call to help debug why the task never completed.

## debug(timeout)

Create a debug Zone by passing the debug function a timeout in milliseconds:

```js
var debug = require("can-zone/debug");
var Zone = require("can-zone");

new Zone({
	plugins: [
		debug(5000)
	]
});
```

## debug(timeoutZone)

Create a debug Zone by passing in a timeout Zone that was already created:

```js
var timeout = require("can-zone/timeout");
var debug = require("can-zone/debug");
var Zone = require("can-zone");

var timeoutZone = timeout(5000);
var debugZone = debug(timeoutZone);

new Zone({
	plugins: [
		timeoutZone,
		debugZone
	]
});
```
