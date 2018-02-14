@property {can-zone} can-zone.current current
@parent can-zone.static

@signature `Zone.current`

Represents the currently running [can-zone zone]. If the code using **Zone.current** is not running within a zone the value will be undefined.

```js
import Zone from "can-zone";

const myZone = new Zone();

myZone.run( function() {

	Zone.current === myZone;

} );
```
