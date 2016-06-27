@function can-zone.prototype.addWait addWait
@parent can-zone.prototype

@signature `zone.addWait()`

Adds a wait to the [can-zone Zone]. Adding a wait will delay the Zone's Promise from resolving (the promise created by calling [can-zone.prototype.run zone.run]) by incrementing its internal counter.

Usually a corresponding [can-zone.prototype.removeWait] will be called to decrement the counter.

```js
new Zone().run(function(){

	var zone = Zone.current;

	zone.addWait(); // counter at 1
	zone.removeWait(); // counter at 0, Promise resolves

}).then(function(){

});
```
