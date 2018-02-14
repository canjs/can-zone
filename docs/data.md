@property {{}} can-zone.prototype.data data
@parent can-zone.prototype

@signature `zone.data`

You might want to get data back from can-zone, for example if you are using the library to track asynchronous rendering requests. Each zone contains a **data** object which can be used to store artibitrary values.

```js
import Zone from "can-zone";

const xhr = new XMLHttpRequest();
xhr.open( "GET", "http://example.com" );
xhr.onload = function() {

	// Save this data for later
	Zone.current.data.xhr = xhr.responseText;
};
xhr.send();
```

