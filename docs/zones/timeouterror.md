@typedef {Error} can-zone/timeout.TimeoutError TimeoutError
@parent can-zone/timeout

@inherits {Error} Inherits from a normal [Error object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error).

@description A special type of Error that also includes the number of milliseconds that were waited before timing out.

The error object is included with the timeout module:

```js
var timeout = require("can-zone/timeout");

var TimeoutError = timeout.TimeoutError;
// Maybe use this to check `instanceof`.
```

@option {Number} timeout Specifies the timeout that was exceeded.
