@function can-zone.error error
@parent can-zone.static

@signature `Zone.error(err)`

Allows you to add an error to the currently running zone.

```js
import Zone from "can-zone";

new Zone().run( function() {

	setTimeout( function() {
		Zone.error( new Error( "oh no" ) );
	}, 100 );

} ).then( null, function( error ) {
	error; // -> {message: "oh no"}
} );
```

@param {Error} err
