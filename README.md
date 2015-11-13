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

## License

MIT
