@typedef {function():can-zone.ZoneSpec} can-zone.makeZoneSpec makeZoneSpec
@parent can-zone.types

A function that returns a [can-zone.ZoneSpec] object. This can be used any place where a [can-zone.ZoneSpec] is accepted.

Using a function rather than a ZoneSpec object gives you a closure where you can store local variables that will be specific to the [can-zone Zone] you are running in.

@param {can-zone.prototype.data} data The [can-zone Zone's] data object, useful when you want to append data to the Zone.

This examples wraps [document.createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement) to keep count of how many elements are created, and appends the count to [can-zone.prototype.data] when the Zone ends.

```js
var mySpec = function(data){
	var realCreateElement,
		count = 0;

	return {
		beforeTask: function(){
			realCreateElement = document.createElement;
			document.createElement = function(){
				count++;
				return realCreateElement.apply(this, arguments);
			};
		},
		afterTask: function(){
			document.createElement = realCreateElement;
		},
		ended: function(){
			data.elementsCreated = count;
		}
	};
};

var zone = new Zone(mySpec);

zone.run(function(){
	// Do stuff here
})
.then(function(data){
	data.elementsCreated; // -> 5
});
```

@return {can-zone.ZoneSpec} A [can-zone.ZoneSpec]
