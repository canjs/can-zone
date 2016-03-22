var env = require("./env");
var slice = Array.prototype.slice;

if(env.isNode) {
	var globalTimeoutId = 1;
}

exports.setTimeout = function(setTimeout){
	return function(fn, timeout){
		var zone = Zone.current;
		var callback = zone.waitFor(function(){
			delete zone.ids[id];
			return fn.apply(this, arguments);
		});
		var timeoutId = setTimeout.call(this, callback, timeout);
		var id = timeoutId;
		if(env.isNode) {
			id = timeoutId.__timeoutId = globalTimeoutId++;
		}
		if(!zone.isResolved) {
			zone.ids[id] = timeoutId;
		}
		return timeoutId;
	}
};

exports.clearTimeout = function(clearTimeout){
	return function(timeoutId){
		// If no timeoutId is passed just call the parent
		// https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout#Notes
		if(timeoutId == null) {
			return clearTimeout.apply(this, arguments);
		}
		var zone = Zone.current;
		var ids = zone.ids;
		var id = env.isNode ? timeoutId.__timeoutId : timeoutId;
		if(!zone.isResolved && ids[id]) {
			delete ids[id];
			zone.removeWait();
		}
		return clearTimeout.apply(this, arguments);
	};
};

exports.requestAnimationFrame = function(rAF){
	return function(fn){
		var callback = Zone.current.waitFor(fn);
		return rAF.call(this, callback);
	};
};

exports.then = function(then){
	return function(onFulfilled, onRejected){
		var fn;
		var callback = Zone.current.waitFor(function(val){
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
};

var supportsOnload = undefined;
exports.send = function(send){
	if(typeof supportsOnload === "undefined") {
		supportsOnload = ("onload" in new XMLHttpRequest());
	}

	return function(){
		var onreadystatechange = this.onreadystatechange,
			onload = this.onload,
			onerror = this.onerror,
			thisXhr = this,
			zone = Zone.current;

		zone.addWait();

		if(supportsOnload) {
			this.onload = createCallback(onload);
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
};

exports.nextTick = function(nextTick){
	return function(fn/*, ...args */){
		var callback = Zone.current.waitFor(fn);
		var args = slice.call(arguments, 1);
		args.unshift(callback);
		return nextTick.apply(process, args);
	};
};

exports.MutationObserver = function(MutationObserver){
	return function(fn){
		fn = Zone.current.wrap(fn);
		return new MutationObserver(fn);
	};
};