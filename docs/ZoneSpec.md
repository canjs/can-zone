@typedef {{}} can-zone.ZoneSpec ZoneSpec
@parent can-zone.types

@description
A ZoneSpec is the way you tap into the lifecycle hooks of a [can-zone Zone]. The hooks are described below.

Using these hooks you can do things like create timers and override global variables that will change the *shape* of code that runs within the Zone.

	@option {function} created

	Called when the zone is first created, after all ZoneSpecs have been parsed. this is useful if you need to do setup behavior that covers the entire zone lifecycle.

	```js
	new Zone({
		created: function(){
			// Called as soon as `new Zone` is called
		}
	});
	```

	@option {function} beforeRun

	Called immediately before the [can-zone.prototype.run] function is called.

	```js
	var zone = new Zone({
		beforeRun: function(){
			// Setup that needs to happen immediately before running
			// the zone function
		}
	});

	zone.run(function() { ... });
	```

	@option {function} afterRun

	Called immediately after the [can-zone.prototype.run] function is called. This hook is useful for any cleanup that might need to be done after the run function is called, but before the zone's promise is resolved. You might use this if the promise is not waited on before performing some action.

	```js
	require("http").createServer(function(req, res){
		var zone = new Zone(function(data){
			var document = new SomeDocument();

			return {
				...
				afterRun: function(){
					data.html = document.documentElement.outerHTML;
				}
			};
		});

		zone.run(render); // We don't want to wait for all async stuff.

		res.write(zone.data.html);
		res.end();
	}).listen(8080);
	```

	@option {function()} beforeTask

	Called before each Task is called. Use this to override any globals you want to exist during the execution of the task:

	```js
	new Zone({
		beforeTask: function(){
			window.setTimeout = mySpecialSetTimeout;
		}
	});
	```

	@option {function} ended

	Called when the Zone has ended and is about to exit (it's Promise will resolve).

	@option {Array<string>} hooks

	**hooks** allows you to specify custom hooks that your plugin calls. This is mostly to communicate between plugins that inherit each other.

	```js
	var barZone = {
		created: function(){
			this.execHook("beforeBar");
		},

		hooks: ["beforeBar"]
	};

	var fooZone = {
		beforeBar: function(){
			// Called!
		},
		plugins: [barZone]
	};

	new Zone({
		plugins: [fooZone]
	});

	zone.run(function() { ... });
	```

	@option {Array<can-zone.ZoneSpec|can-zone.makeZoneSpec>} plugins

	Allows specifying nested [can-zone.ZoneSpec ZoneSpecs] that the current depends on. This allows creating rich plugins that depend on other plugins (ZoneSpecs). You can imagine having a bunch of tiny plugins that do one thing and then composing them together into one meta-plugin that is more end-user friendly.

	Similar to the [can-zone Zone] constructor you can either specify [can-zone.ZoneSpec] objects or functions that return ZoneSpec objects. The former gives you a closure specific to the Zone, which is often needed for variables. These two forms are equivalent:

	```js
	var specOne = {
		created: function(){

		}
	};

	var specTwo = function(){
		return {
			created: function(){

			}
		}
	};

	var zone = new Zone({
		plugins: [ specOne, specTwo ]
	});
	```
