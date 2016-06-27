@function can-zone.prototype.removeWait removeWait
@parent can-zone.prototype

@signature `zone.removeWait()`

Decrements the [can-zone Zone's] internal counter that is used to decide when its [can-zone.prototype.run run Promise] will resolve.

Usually used in conjuction with [can-zone.prototype.addWait]. Most of the time you'll want to use [can-zone.waitFor], but in some cases where a callback is not enough to know waiting is complete, using addWait/removeWait gives you finer grained control.

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
