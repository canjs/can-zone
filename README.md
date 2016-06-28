![can-zone-logo](https://cloud.githubusercontent.com/assets/361671/14564599/4249847e-02f5-11e6-8704-13fca28a9426.png)

# can-zone

[![Build Status](https://travis-ci.org/canjs/can-zone.svg?branch=master)](https://travis-ci.org/canjs/can-zone)
[![npm version](https://badge.fury.io/js/can-zone.svg)](http://badge.fury.io/js/can-zone)

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

- <code>[__can-zone__ function](#can-zone-function)</code>
  - <code>[new Zone()](#new-zone)</code>
  - <code>[new Zone(zoneSpec)](#new-zonezonespec)</code>
    - _static_
      - <code>[Zone.waitFor(fn)](#zonewaitforfn)</code>
      - <code>[Zone.current](#zonecurrent)</code>
      - <code>[Zone.ignore(fn)](#zoneignorefn)</code>
      - <code>[Zone.error(err)](#zoneerrorerr)</code>
    - _prototype_
      - <code>[zone.run(fn)](#zonerunfn)</code>
      - <code>[zone.data](#zonedata)</code>
      - <code>[zone.addWait()](#zoneaddwait)</code>
      - <code>[zone.removeWait()](#zoneremovewait)</code>
    - _types_
      - <code>[ZoneSpec Object](#zonespec-object)</code>
      - <code>[makeZoneSpec function([data](#zonedata))](#makezonespec-functiondatazonedata)</code>
    - _modules_
      - <code>[__can-zone/register__ function](#can-zoneregister-function)</code>
    - _plugins_
      - <code>[__can-zone/timeout__ function(ms)](#can-zonetimeout-functionms)</code>
        - <code>[timeout(ms)](#timeoutms)</code>
          - <code>[TimeoutError Error](#timeouterror-error)</code>
      - <code>[__can-zone/debug__ function](#can-zonedebug-function)</code>
        - <code>[debug(ms)](#debugms)</code>
        - <code>[debug(timeoutZone)](#debugtimeoutzone)</code>
          - <code>[DebugInfo Array\<Object\>](#debuginfo-arrayobject)</code>

## <code>__can-zone__ function</code>



### <code>new Zone()</code>


Creates a new Zone with no additional overrides. Can then call [zone.run](#zonerunfn) to call a function within the Zone.

```js
var Zone = require("can-zone");

var zone = new Zone();

zone.run(function(){

	return "hello world";

}).then(function(data){
	data.result // -> "hello world"
});
```


### <code>new Zone(zoneSpec)</code>


Create a new Zone using the provided [ZoneSpec](#zonespec-object) to configure the Zone. The following examples configures a Zone that will time out after 5 seconds.

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


1. __zoneSpec__ <code>{[ZoneSpec](#zonespec-object)|[makeZoneSpec](#makezonespec-functiondatazonedata)([data](#zonedata))}</code>:
  A [ZoneSpec](#zonespec-object) object or a [function that returns](#makezonespec-functiondatazonedata) a ZoneSpec object.
  
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
  
  The latter form is useful so that you have a closure specific to that [Zone](#new-zone).
  

#### <code>Zone.waitFor(fn)</code>


**Zone.waitFor** is a function that creates a callback that can be used with any async functionality. Calling Zone.waitFor registers a wait with the currently running request and returns a function that, when called, will decrement the wait count.

This is useful if there is async functionality other than what [we implement](#tasks). You might be using a library that has C++ bindings and doesn't go through the normal JavaScript async APIs.

```js
var Zone = require("can-zone");
var fs = require("fs");

fs.readFile("data.json", "utf8", Zone.waitFor(function(){
	// We waited on this!
}));
```


1. __fn__ <code>{function}</code>:
  
  

#### <code>Zone.current</code>


Represents the currently running [zone](#new-zone). If the code using **Zone.current** is not running within a zone the value will be undefined.

```js
var Zone = require("can-zone");

var myZone = new Zone();

myZone.run(function(){

	Zone.current === myZone;

});
```


#### <code>Zone.ignore(fn)</code>


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


1. __fn__ <code>{function}</code>:
  A function that contains calls to asynchronous functions that are needing to be ignored.
  

- __returns__ <code>{function}</code>:
  A function in which calls to [addWait](#zoneaddwait) and [removeWait](#zoneremovewait) will be ignored, preventing the Zone's promise from remaining unresolved while asynchronous activity continues within.
  

#### <code>Zone.error(err)</code>


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


1. __err__ <code>{Error}</code>:
  
  

#### <code>zone.run(fn)</code>


Runs a function within a [Zone](#new-zone). Calling run will set the Zone's internal Promise which will only resolve once all asynchronous calls within `fn` are complete.


1. __fn__ <code>{function}</code>:
  Any function which needs to run within the Zone. The function will be executed immediately.
  

- __returns__ <code>{Promise\<[data](#zonedata)\>}</code>:
  Returns a promise that will resolve with the Zone's [data](#zonedata) object.
  
  ```js
  var zone = new Zone();
  
  zone.run(function(){
  
  	setTimeout(function(){
  		zone.data.foo = "bar";
  	});
  
  }).then(function(data){
  	data.foo // -> "bar"
  });
  ```
  

#### <code>zone.data</code>


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



#### <code>zone.addWait()</code>


Adds a wait to the [Zone](#new-zone). Adding a wait will delay the Zone's Promise from resolving (the promise created by calling [zone.run](#zonerunfn)) by incrementing its internal counter.

Usually a corresponding [removeWait](#zoneremovewait) will be called to decrement the counter.

```js
new Zone().run(function(){

	var zone = Zone.current;

	zone.addWait(); // counter at 1
	zone.removeWait(); // counter at 0, Promise resolves

}).then(function(){

});
```


#### <code>zone.removeWait()</code>


Decrements the [Zone's](#new-zone) internal counter that is used to decide when its [run Promise](#zonerunfn) will resolve.

Usually used in conjuction with [addWait](#zoneaddwait). Most of the time you'll want to use [waitFor](#zonewaitforfn), but in some cases where a callback is not enough to know waiting is complete, using addWait/removeWait gives you finer grained control.

```js
var zone = new Zone();

var obj = new SomeObject();

// This is only done when the event.status is 3
obj.onprogress = function(ev){
	if(ev.status === 3) {
		zone.removeWait();
	}
};

zone.addWait();
```

#### ZoneSpec `{Object}`

 A ZoneSpec is the way you tap into the lifecycle hooks of a [Zone](#new-zone). The hooks are described below.

Using these hooks you can do things like create timers and override global variables that will change the *shape* of code that runs within the Zone.




##### <code>Object</code>

- __created__ <code>{function}</code>:
  
  
  Called when the zone is first created, after all ZoneSpecs have been parsed. this is useful if you need to do setup behavior that covers the entire zone lifecycle.
  
  ```js
  new Zone({
  	created: function(){
  		// Called as soon as `new Zone` is called
  	}
  });
  ```
  
- __beforeRun__ <code>{function}</code>:
  
  
  Called immediately before the **Zone.prototype.run** function is called.
  
  ```js
  var zone = new Zone({
  	beforeRun: function(){
  		// Setup that needs to happen immediately before running
  		// the zone function
  	}
  });
  
  zone.run(function() { ... });
  ```
  
- __beforeTask__ <code>{function}</code>:
  
  
  Called before each Task is called. Use this to override any globals you want to exist during the execution of the task:
  
  ```js
  new Zone({
  	beforeTask: function(){
  		window.setTimeout = mySpecialSetTimeout;
  	}
  });
  ```
  
- __ended__ <code>{function}</code>:
  
  
  Called when the Zone has ended and is about to exit (it's Promise will resolve).
  
- __hooks__ <code>{Array\<string\>}</code>:
  
  
  **hooks** allows you to specify custom hooks that your plugin calls. This is mostly to communicate between plugins that inherit each other.
  
  ```js
  var barZone = {
  	created: function(){
  		this.execHook("beforeBar");
  	},
  
  	hooks: ["beforeBar"]
  };
  
  var fooZone = {
  	beforeBar: function(){
  		// Called!
  	},
  	plugins: [barZone]
  };
  
  new Zone({
  	plugins: [fooZone]
  });
  
  zone.run(function() { ... });
  ```
  
- __plugins__ <code>{Array\<[ZoneSpec](#zonespec-object)|[makeZoneSpec](#makezonespec-functiondatazonedata)([data](#zonedata))\>}</code>:
  
  
  Allows specifying nested [ZoneSpecs](#zonespec-object) that the current depends on. This allows creating rich plugins that depend on other plugins (ZoneSpecs). You can imagine having a bunch of tiny plugins that do one thing and then composing them together into one meta-plugin that is more end-user friendly.
  
  Similar to the [Zone](#new-zone) constructor you can either specify [ZoneSpec](#zonespec-object) objects or functions that return ZoneSpec objects. The former gives you a closure specific to the Zone, which is often needed for variables. These two forms are equivalent:
  
  ```js
  var specOne = {
  	created: function(){
  
  	}
  };
  
  var specTwo = function(){
  	return {
  		created: function(){
  
  		}
  	}
  };
  
  var zone = new Zone({
  	plugins: [ specOne, specTwo ]
  });
  ```
  
#### makeZoneSpec `{function([data](#zonedata))}`


A function that returns a [ZoneSpec](#zonespec-object) object. This can be used any place where a [ZoneSpec](#zonespec-object) is accepted.



##### <code>function([data](#zonedata))</code>


1. __data__ <code>{[data](#zonedata)}</code>:
  The [Zone's](#new-zone) data object, useful when you want to append data to the Zone.
  
  This examples wraps [document.createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement) to keep count of how many elements are created, and appends the count to [data](#zonedata) when the Zone ends.
  
  ```js
  var mySpec = function(data){
  	var realCreateElement,
  		count = 0;
  
  	return {
  		beforeTask: function(){
  			realCreateElement = document.createElement;
  			document.createElement = function(){
  				count++;
  				return realCreateElement.apply(this, arguments);
  			};
  		},
  		afterTask: function(){
  			document.createElement = realCreateElement;
  		},
  		ended: function(){
  			data.elementsCreated = count;
  		}
  	};
  };
  
  var zone = new Zone(mySpec);
  
  zone.run(function(){
  	// Do stuff here
  })
  .then(function(data){
  	data.elementsCreated; // -> 5
  });
  ```
  

- __returns__ <code>{[ZoneSpec](#zonespec-object)}</code>:
  A [ZoneSpec](#zonespec-object)
  
#### can-zone/register `{function}`

 
In order to do it's magic, [can-zone](#new-zone) has to register handlers for all of the common JavaScript async operations. If you have code (or a dependency with this code) that does:

```js
var st = setTimeout;
```

And this module loads before can-zone, any time `st` is used we won't be able to track that within the Zone.

To work around this, **can-zone/register** is used as a script that you run before any other modules.

### In Node

```js
require("can-zone/register");
```

At the top of your entry-point script.

### In the Browser

You can either add a script tag above all others:

```js
<script src="node_modules/can-zone/register.js"></script>
```

Or, if you're using a module loader / bundler, configure it so that can-zone/register is placed above all others in the bundle.




##### <code>function()</code>


- __returns__ <code>{undefined}</code>:
  

#### <code>__can-zone/timeout__ function(ms)</code>



##### <code>timeout(ms)</code>


Creates a [ZoneSpec](#zonespec-object) that you can use as a plugin for your [Zone](#new-zone) in order to timeout after a certain length of time (as `ms`).

If the Zone times out it's [run promise](#zonerunfn) will be rejected with a [TimeoutError](#timeouterror-error), a special error that also includes the number of milliseconds waited before timing out.

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


1. __ms__ <code>{Number}</code>:
  The number of milliseconds to wait before timing out the [Zone](#new-zone).
  

- __returns__ <code>{[ZoneSpec](#zonespec-object)}</code>:
  A ZoneSpec that can be passed as a plugin.
  
###### TimeoutError `{Error}`

A special type of Error that also includes the number of milliseconds that were waited before timing out. 
The error object is included with the timeout module:

```js
var timeout = require("can-zone/timeout");

var TimeoutError = timeout.TimeoutError;
// Maybe use this to check `instanceof`.
```




####### <code>Error</code>

- __timeout__ <code>{Number}</code>:
  Specifies the timeout that was exceeded.
  

#### <code>__can-zone/debug__ function</code>



##### <code>debug(ms)</code>


Creates a new [ZoneSpec](#zonespec-object) that can be provided to your Zone, timing out in `ms` (milliseconds).

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

See the [DebugInfo](#debuginfo-arrayobject) type for a list of properties 


1. __ms__ <code>{Number}</code>:
  The timeout, in milliseconds, before the [Zone](#new-zone) will be rejected and debug information attached to the [zone's data](#zonedata) object.
  

##### <code>debug(timeoutZone)</code>


Like the previous signature, but directly pass it a [timeout ZoneSpec](#timeoutms) object that you create yourself.

```js
var debug = require("can-zone/debug");
var timeout = require("can-zone/timeout");

var timeoutZone = timeout(5000);
var debugZone = debug(timeoutZone):

...
```


1. __timeoutZone__ <code>{[can-zone/timeout](#timeoutms)}</code>:
  A [ZoneSpec](#zonespec-object) created using the timeout plugin.
  
###### DebugInfo `{Array\<Object\>}`

An array of objects containing information useful for debugging. Gives you the name of the **task** that failed to complete and a **stack** trace of where the error occured. 
Each object has a shape of:

```js
{
	"task": "setTimeout",
	"stack": Error ...."
}
```




####### <code>Array\<Object\></code>

- __task__ <code>{String}</code>:
  An identifier of the task that failed to complete. This can be any of the [asynchronous tasks](https://github.com/canjs/can-zone#tasks) supported by can-zone like `setTimeout` or `Promise`.
  
  
- __stack__ <code>{String}</code>:
  A stack trace taken as a snapshot when the task was called. This allows you t see the source of the call to help debug why the task never completed.
  

## License

MIT
