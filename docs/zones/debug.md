@module {function} can-zone/debug can-zone/debug
@parent can-zone.plugins

@signature `debug(ms)`

Creates a new [can-zone.ZoneSpec] that can be provided to your Zone, timing out in `ms` (milliseconds).

```js
var Zone = require("can-zone");
var debug = require("can-zone/debug");

var zone = new Zone({
	plugins: [debug(5000)]
})
.catch(function(err){
	var info = zone.data.debugInfo;
});
```

See the [can-zone/debug.DebugInfo] type for a list of properties.

@param {Number} ms The timeout, in milliseconds, before the [can-zone Zone] will be rejected and debug information attached to the [can-zone.prototype.data zone's data] object.

@signature `debug(timeoutZone)`

Like the previous signature, but directly pass it a [can-zone/timeout timeout ZoneSpec] object that you create yourself.

```js
var debug = require("can-zone/debug");
var timeout = require("can-zone/timeout");

var timeoutZone = timeout(5000);
var debugZone = debug(timeoutZone):

...
```

@param {can-zone/timeout} timeoutZone A [can-zone.ZoneSpec] created using the timeout plugin.

@signature `debug(timeoutOrTimeoutZone, options)`

Creates a new [can-zone.ZoneSpec] using either a timeout in milliseconds, or a [can-zone/timeout timeout ZoneSpec], along with an *options* object. The following options are available:

@param {Number|can-zone/timeout} timeoutOrTimeoutZone Either a `Number` timeout, or a [can-zone/timeout timeout ZoneSpec].

@param {Object} [options] An options object with the following parameters:

  * __break__ (Boolean): When enabled, causes a `debugger;` statement to be hit after the timeout is complete. This allows stepping into the code that is preventing the Zone's run promise from completing.

@body

## Use

The **debug** zone gives you information about which tasks failed to complete in case of a timeout. It is to be used with [./timeout.md](can-zone/timeout).

When a timeout occurs the debug Zone will appending debug information to the Zone's [data](https://github.com/canjs/can-zone/blob/master/docs/data.md) property, which can be retrieved when the Zone's promise is rejected:

```js
var debug = require("can-zone/debug");
var Zone = require("can-zone");

var zone = new Zone(debug(5000));

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
	"stack": "Error ...."
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

new Zone([
	debug(5000)
[);
```

## debug(timeoutZone)

Create a debug Zone by passing in a timeout Zone that was already created:

```js
var timeout = require("can-zone/timeout");
var debug = require("can-zone/debug");
var Zone = require("can-zone");

var timeoutZone = timeout(5000);
var debugZone = debug(timeoutZone);

new Zone([
	timeoutZone,
	debugZone
]);
```

## Break on timeout

The default behavior of the debug zone is to store stack traces on `zone.data.debugInfo`. Some times it is easier to actually step into the code that is running. You can enable this behavior by setting the `break` option like so:

```js
var Zone = require("can-zone");
var debug = require("can-zone/debug");

var zone = new Zone([
	debug(5000, { break: true });
]);
```

When the zone times out you'll dropped into this breakpoint:

<img alt="Break on timeout" style="max-width:100%;" src="https://user-images.githubusercontent.com/361671/32962443-6eb478d8-cb9a-11e7-9f88-f60ff5712f01.png"/>

As the comment says, you can step into the proceeding function to find the code that is responsible for the zone's run promise not completing.
