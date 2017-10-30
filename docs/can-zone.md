@module {function} can-zone
@parent can-js-utilities
@collection can-ecosystem
@group can-zone.static static
@group can-zone.prototype prototype
@group can-zone.types types
@group can-zone.modules modules
@group can-zone.plugins plugins
@package ../package.json

@description A library that tracks asynchronous activity and lets you know when it has completed. Useful when you need to call a function and wait for all async behavior to complete, such as when performing server-side rendering.

@signature `new Zone()`

Creates a new Zone with no additional overrides. Can then call [can-zone.prototype.run zone.run] to call a function within the Zone.

```js
var Zone = require("can-zone");

var zone = new Zone();

zone.run(function(){

	return "hello world";

}).then(function(data){
	data.result // -> "hello world"
});
```

*Note: See the [can-zone/register docs](https://github.com/canjs/can-zone/blob/master/docs/register.md) about ensuring can-zone is registered properly.*

@signature `new Zone(zoneSpec)`

Create a new Zone using the provided [can-zone.ZoneSpec] to configure the Zone. The following examples configures a Zone that will time out after 5 seconds.

```js
var Zone = require("can-zone");

var timeoutSpec = function(){
	var timeoutId;

	return {
		created: function(){
			timeoutId = setTimeout(function(){
				Zone.error(new Error("This took too long!"));
			}, 5000);
		},
		ended: function(){
			clearTimeout(timeoutId);
		}
	};
};

var zone = new Zone(timeoutSpec);
```

@param {can-zone.ZoneSpec|can-zone.makeZoneSpec} zoneSpec A [can-zone.ZoneSpec] object or a [can-zone.makeZoneSpec function that returns] a ZoneSpec object.

These two are equivalent:

```js
new Zone({
	created: function(){

	}
});

new Zone(function(){
	return {
		created: function(){

		}
	};
});
```

The latter form is useful so that you have a closure specific to that [can-zone Zone].

@body

## Tasks

JavaScript uses various task queues (and a microtask queue) to run JavaScript in the event loop. See [this article](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) and [this StackOverflow answer](http://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context) to learn more.

For can-zone to work we have to override various task-creating functionality, this is the list of what we currently implement:

**Macrotasks**

* setTimeout
* XMLHttpRequest

**Microtasks**

* requestAnimationFrame
* Promise
* process.nextTick

## Use

**can-zone** is a library that aids in tracking asynchronous calls in your application. To create a new Zone call it's constructor function with `new`:

```js
var zone = new Zone();
```

This gives you a [can-zone Zone] from which you can run code using [can-zone.prototype.run zone.run]:

```js
var Zone = require("can-zone");

new Zone().run(function(){

	setTimeout(function(){
		
	}, 29);

	setTimeout(function(){
		
	}, 13);

	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://chat.donejs.com/api/messages");
	xhr.onload = function(){
		
	};
	xhr.send();

}).then(function(){
	// All done!
});
```

The function you provide to [can-zone.prototype.run] will be run within the Zone. This means any calls to asynchronous functions (in this example `setTimeout`)	will be waited on.

## Tasks

JavaScript uses various task queues (and a microtask queue) to run JavaScript in the event loop. See [this article](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) and [this StackOverflow answer](http://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context) to learn more.

For can-zone to work we have to override various task-creating functionality, this is the list of what we currently implement:

**Macrotasks**

* setTimeout
* XMLHttpRequest

**Microtasks**

* requestAnimationFrame
* Promise
* process.nextTick
