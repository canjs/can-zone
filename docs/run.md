@function can-zone.prototype.run run
@parent can-zone.prototype

@signature `zone.run(fn)`

Runs a function within a [can-zone Zone]. Calling run will set the Zone's internal Promise which will only resolve once all asynchronous calls within `fn` are complete.

@param {function} fn Any function which needs to run within the Zone. The function will be executed immediately.

@return {Promise<can-zone.prototype.data>} Returns a promise that will resolve with the Zone's [can-zone.prototype.data] object.

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
