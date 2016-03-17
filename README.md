[![Build Status](https://travis-ci.org/canjs/can-zone.svg?branch=master)](https://travis-ci.org/canjs/can-zone)
[![npm version](https://badge.fury.io/js/can-zone.svg)](http://badge.fury.io/js/can-zone)

# can-zone

A library that tracks asynchronous activity and lets you know when it has completed. Useful when you need to call a function and wait for all async behavior to complete, such as when performing server-side rendering.

## Install

```
npm install can-zone --save
```

## Usage

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

*Note: See the [can-zone/register docs](https://github.com/canjs/can-zone/blob/master/docs/register.md) about ensuring can-zone is registered properly.*

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

## API

In Node there are various async methods that do not fall into the most common macrotasks, but still might need to be tracked. To accomodate this we expose a global `Zone.waitFor` function that can be used to wait on the outcome of an asynchronous request.

```js
var Zone = require("can-zone");
var fs = require("fs");

fs.readFile("some/file", Zone.waitFor(function(err, file){
	// We've waited
}));
```

### Zone.current

Represents the currently running zone. If the code using **Zone.current** is not running within a zone the value will be undefined.

```js
var Zone = require("can-zone");

var myZone = new Zone();

myZone.run(function(){

	Zone.current === myZone;

});
```

### Zone.waitFor

**Zone.waitFor** is a function that creates a callback that can be used with any async functionality. Calling Zone.waitFor registers a wait with the currently running request and returns a function that, when called, will decrement the wait count.

This is useful if there is async functionality other than what [we implement](#tasks). You might be using a library that has C++ bindings and doesn't go through the normal JavaScript async APIs.

```js
var Zone = require("can-zone");
var asyncThing = require("some-module-that-does-secret-async-stuff");

asyncThing(Zone.waitFor(function(){
	// We waited on this!
}));
```

### Zone.prototype.data

You might want to get data back from can-zone, for example if you are using the library to track asynchronous rendering requests. Each zone contains a **data** object which can be used to store artibitrary values.

```js
var Zone = require("can-zone");

var xhr = new XMLHttpRequest();
xhr.open("GET", "http://example.com");
xhr.onload = function(){
	// Save this data for later
	Zone.current.data.xhr = xhr.responseText;
};
xhr.send();
```

### Zone.error

Allows you to add an error to the currently running zone.

```js
var Zone = require("can-zone");

new Zone().run(function(){

	setTimeout(function(){
		Zone.error(new Error("oh no"));
	}, 100);

}).then(null, function(error){
	error; // -> {message: "oh no"}
});
```

### Zone.ignore

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

### ZoneSpec

Each zone you create takes a **ZoneSpec** that defines behaviors that will be added to the zone. A common use case is to provide globals that you want to add within the zone. Common globals such as **document**, **window**, and **location** can be placed directly on the zoneSpec, all others within the **globals** object.

```js
var Zone = require("can-zone");

var zone = new Zone({
	document: document,
	globals: {
		foo: "bar"
	}
});
```

The ZoneSpec can be provided as an object (like above) or a function that returns a ZoneSpec:

```js
var Zone = require("can-zone");

var zone = new Zone(function(){
	var foo = "bar";
	return {
		beforeTask: function(){
			global.foo = foo;
		}
	}
});
```

**Plugins** provide a way to inherit behavior defined in other ZoneSpecs. Here's a plugin that changes the title of your page randomly.

```js
var titleZone = function(){
	return {
		beforeTask: function(){
			document.title = Math.random() + " huzzah!";
		}
	}
};

var zone = new Zone({
	plugins: [titleZone]
});
```

Since plugins are also defined with ZoneSpecs (or functions that return ZoneSpecs) this means you can have plugins that use plugins, that use plugins... We hope that there will be developed "bundles" of plugins that provide robust behaviors.

The ZoneSpec defines the following hooks:

#### created

Called when the zone is first created, after all ZoneSpecs have been parsed. this is useful if you need to do setup behavior that covers the entire zone lifecycle.

#### beforeTask

Called before each Task is called. Use this to override any globals you want to exist during the execution of the task:

```js
new Zone({
	beforeTask: function(){
		window.setTimeout = mySpecialSetTimeout;
	}
});
```

#### afterTask

Called after each Task is complete. Use this to restore state that was replaced in **beforTask**:

```js
var oldSetTimeout;

new Zone({
	beforeTask: function(){
		oldSetTimeout = window.setTimeout;
		window.setTimeout = mySpecialSetTimeout;
	},
	afterTask: function(){
		window.setTimeout = oldSetTimeout;
	}
});
```


#### ended

Called when the Zone has ended and is about to exit (it's Promise will resolve).

## License

MIT
