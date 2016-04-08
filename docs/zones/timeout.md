# can-zone/timeout

The timeout zone allows you to specify a timeout for your Zone. If the Zone promise doesn't resolve before timing out, the Zone promise will be rejected by the plugin.

The **timeout** zone is a function that takes a timeout in milliseconds.

The Promise will reject with a special type of Error, a **TimeoutError**.

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
