var util = require("../util");
var env = require("../env");
var g = env.global;
var slice = Array.prototype.slice;
var Override = require("../override");

if(env.isNode) {
	var globalTimeoutId = 1;
}

module.exports = function(){
	var globals, overrides = [];

	return {
		name: "globals",
		created: function(){
			var zone = this;
			globals = this.globals || {};

			function findObj(name, obj){
				var parts = name.split(".");
				var property = parts.pop();
				util.forEach.call(parts, function(prop){
					var n = obj[prop];
					if(!n) {
						n = obj[prop] = {};
					}
					obj = n;
				});
				return {
					obj: obj,
					prop: property
				};
			}

			// Turn globals into overrides
			function addGlobal(name, value){
				var info = findObj(name, g);

				overrides.push(new Override(info.obj, info.prop, function(){
					return value;
				}));
			}
			for(var name in globals) {
				addGlobal(name, globals[name]);
			}

			util.forEach.call(allOverrides, function(fn){
				var def = fn(zone);
				if(def) {
					overrides.push(def);
				}
			});
		},

		beforeTask: function(task){
			if(task.nestedTask) return;
			util.forEach.call(overrides, function(o){
				o.trap();
			});
		},

		afterTask: function(task){
			if(task.nestedTask) return;
			util.forEach.call(overrides, function(o){
				o.release();
			});
		}
	};
};

var allOverrides = [
	function(zone){
		return new Override(g, "setTimeout", function(setTimeout){
			return function(fn, timeout){
				var callback = zone.wrapAndWait(function(){
					delete zone.ids[id];
					return fn.apply(this, arguments);
				});
				var timeoutId = setTimeout.call(this, callback, timeout);
				var id = timeoutId;
				if(env.isNode) {
					id = timeoutId.__timeoutId = globalTimeoutId++;
				}
				zone.ids[id] = timeoutId;
				return timeoutId;
			}
		});
	},

	function(zone){
		return new Override(g, "clearTimeout", function(clearTimeout){
			return function(timeoutId){
				// If no timeoutId is passed just call the parent
				// https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout#Notes
				if(timeoutId == null) {
					return clearTimeout.apply(this, arguments);
				}

				var ids = zone.ids;
				var id = env.isNode ? timeoutId.__timeoutId : timeoutId;
				if(ids[id]) {
					delete ids[id];
					zone.waits--;

				}
				return clearTimeout.apply(this, arguments);
			};
		});
	},

	function(zone){
		return typeof requestAnimationFrame === "undefined" ?
			undefined :

		new Override(g, "requestAnimationFrame", function(rAF){
			return function(fn){
				var callback = zone.wrapAndWait(fn);
				return rAF.call(this, callback);
			};
		});
	},

	function(zone) {
		return new Override(g.Promise.prototype, "then", function(then){
			return function(onFulfilled, onRejected){
				var fn;
				var callback = zone.wrapAndWait(function(val){
					if(fn) {
						return fn.apply(this, arguments);
					}
					return val;
				}, false);

				var callWith = function(cb){
					return function(){
						fn = cb;
						return callback.apply(this, arguments);
					};
				};

				return then.call(this, callWith(onFulfilled),
								 callWith(onRejected));
			};
		});
	},

	function(zone){
		if(typeof XMLHttpRequest === "undefined") {
			return undefined;
		}

		var supportsOnload = ("onload" in new XMLHttpRequest());

		return new Override(XMLHttpRequest.prototype, "send", function(send){
			return function(){
				var onreadystatechange = this.onreadystatechange,
					onload = this.onload,
					onerror = this.onerror,
					thisXhr = this;

				zone.addWait();

				if(supportsOnload) {
					this.onload = createCallback(function(ev){
						var xhr = ev ? ev.target : thisXhr;
						return onload && onload.apply(this, arguments);
					});
					this.onerror = createCallback(onerror);
				} else {
					onreadystatechange = onreadystatechange || function(){};
					var callback = createCallback(onreadystatechange);
					this.onreadystatechange = function(ev){
						var xhr = ev ? ev.target : thisXhr;

						if(xhr.readyState === 4) {
							return callback.apply(this, arguments);
						} else {
							return onreadystatechange.apply(this, arguments);
						}
					};
				}

				function createCallback(fn){
					fn = fn || function(){};
					return function(){
						var task = new Zone.Task(zone, fn);
						var res = task.run(this, arguments);
						zone.removeWait();
						return res;
					};
				}

				return send.apply(this, arguments);
			};
		});
	},

	function(zone){
		return typeof process === "undefined" || !process.nextTick ?
			undefined :

		new Override(process, "nextTick", function(nextTick){
			return function(fn/*, ...args */){
				var callback = zone.wrapAndWait(fn);
				var args = slice.call(arguments, 1);
				args.unshift(callback);
				return nextTick.apply(process, args);
			};
		});
	}

];

