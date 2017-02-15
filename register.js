"format cjs";
(function(){
	var isNode = typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
	var g = typeof WorkerGlobalScope !== "undefined" && (self instanceof WorkerGlobalScope)
		? self
		: isNode
		? global
		: window;

	if(typeof module !== "undefined" && !!module.exports) {
		module.exports = wrapAll;
	}

	var wrapped = g.__canZoneWrapped;
	if(!wrapped) {
		wrapped = g.__canZoneWrapped = {};
	}

	var forEach = Array.prototype.forEach || function(cb){
		var i = 0, len = this.length;
		for(; i < len; i++) {
			cb.call(this, this[i], i);
		}
	};

	var props = [
		"setTimeout",
		"clearTimeout",
		"requestAnimationFrame",
		"Promise.prototype.then",
		"XMLHttpRequest.prototype.send",
		"Node.prototype.addEventListener",
		"process.nextTick",
		"setImmediate",
		"clearImmediate",
		{ prop: "MutationObserver", fn: function(MutationObserver){
			return function(fn){
				return new MutationObserver(fn);
			};
		} },
		{ prop: "WebSocket.prototype", name: "WebSocketDescriptor",
			descriptor: "onmessage" }
	];

	wrapAll();

	if(g.Promise) {
		monitor(g, "Promise", "Promise.prototype.then");
	}

	function extract(obj, prop) {
		var parts = prop.split(".");
		while(parts.length > 1) {
			prop = parts.shift();
			obj = obj[prop];
			if(!obj) break;
			if(parts.length === 1) prop = parts[0];
		}
		return [obj, prop];
	}

	function wrapAll(){
		forEach.call(props, function(prop){
			var fn, descriptor, taskName;
			if(typeof prop === "object") {
				fn = prop.fn;
				descriptor = prop.descriptor;
				taskName = prop.name;
				prop = prop.prop;
			}

			var key = prop;

			// If this has already been wrapped
			if(wrapped[key]) {
				return;
			}

			var results = extract(g, prop);
			var obj = results[0];
			prop = results[1];

			// This happens if the environment doesn't support this property
			if(!obj || !obj[prop]) {
				return;
			} else {
				wrapped[key] = true;
			}

			if(descriptor) {
				// obj == the prototype
				// descriptor == property name
				wrapDescriptor(obj[prop], descriptor, taskName);
			} else {
				wrapInZone(obj, prop, fn);
			}

		});
	}

	function wrapInZone(object, property, fn) {
		if(fn) {
			fn = fn(object[property]);
		} else {
			fn = object[property];
		}
		var wrappedFn = function(){
			if(typeof CanZone !== "undefined" && !!CanZone.current) {
				return CanZone.tasks[property](fn).apply(this, arguments);
			}

			return fn.apply(this, arguments);
		};
		wrappedFn.zoneWrapped = true;
		object[property] = wrappedFn;
	}

	/**
	 *
	 */
	function wrapDescriptor(prototype, property, taskName) {
		var desc = Object.getOwnPropertyDescriptor(prototype, property);
		var setupDescriptor = function(name){
			var taskSetupFn = CanZone.tasks[taskName];
			if(taskSetupFn) {
				var newDescriptor = CanZone.tasks[taskName](desc);
				Object.defineProperty(prototype, property, newDescriptor);
				return newDescriptor[name];
			} else {
				return desc[name];
			}
		}
		Object.defineProperty(prototype, property, {
			enumerable: desc.enumerable,
			configurable: true,
			get: function(){
				return setupDescriptor('get').apply(this, arguments);
			},
			set: function(val){
				setupDescriptor('set').call(this, val);
			}
		})
	}

	function monitor(object, property, thingToRewrap) {
		var current = object[property];

		Object.defineProperty(object, property, {
			get: function(){
				return current;
			},
			set: function(val){
				var hasChanged = !val.zoneWrapped && val !== current;
				current = val;

				if(hasChanged) {
					var results = extract(object, thingToRewrap);
					var localObject = results[0];
					var localProperty = results[1];
					wrapInZone(localObject, localProperty);
					monitor(object, property, thingToRewrap);
				}
			}
		});
	}

})();
