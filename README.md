# can-wait

A library that tracks asynchronous activity and lets you know when it has completed. Useful when you need to call a function and wait for all async behavior to complete, such as when performing rendering.

## Install

```
npm install can-wait --save
```

## Usage

```js
var canWait = require("can-wait");

var results = [];

canWait(function(){

	setTimeout(function(){
		results.push("a");
	}, 29);

	setTimeout(function(){
		results.push("b");
	}, 13);

	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://chat.donejs.com/api/messages");
	xhr.onload = function(){
		results.push("c");
	};
	xhr.send();


}).then(
	function success() {
		// results -> ["b", "a", "c"]
	},
	function error(errors) {
		// errors -> [err, err, err]
	}
);
```

## Tasks

JavaScript uses various task queues (and a microtask queue) to run JavaScript in the event loop. See [this article](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) and [this StackOverflow answer](http://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context) to learn more.

For can-wait to work we have to override various task-creating functionality, this is the list of what we currently implement:

**Macrotasks**

* setTimeout
* XMLHttpRequest

**Microtasks**

* requestAnimationFrame
* Promise

## License

MIT
