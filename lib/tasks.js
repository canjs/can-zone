var env = require("./env");
var util = require("./util");
var slice = Array.prototype.slice;

if(env.isNode) {
	var globalTimeoutId = 1;
}

var addTimer = function(callback){
	var timeoutId = callback();
	var id = timeoutId;
	if(env.isNode && typeof id !== "number") {
		id = timeoutId.__timeoutId = globalTimeoutId++;
	}
	var zone = CanZone.current;
	if(!zone.isResolved) {
		zone.ids[id] = timeoutId;
	}
	return {
		timeoutId: timeoutId,
		id: id
	};
};

var removeTimer = function(timeoutId, callback){
	// If no timeoutId is passed just call the parent
	// https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout#Notes
	if(timeoutId == null) {
		return callback();
	}
	var zone = CanZone.current;
	var ids = zone.ids;
	var id = (env.isNode && typeof timeoutId !== "number") ?
		timeoutId.__timeoutId : timeoutId;
	if(!zone.isResolved && ids[id]) {
		delete ids[id];
		zone.removeWait();
	}
	return callback();
};

exports.setTimeout = function(setTimeout){
	return function(fn, timeout){
		var args = Array.prototype.slice.call(arguments);
		var zone = CanZone.current;
		var idInfo;
		args[0] = zone.waitFor(function(){
			delete zone.ids[idInfo.id];
			return fn.apply(this, arguments);
		});

		var self = this;
		idInfo = addTimer(function(){
			return setTimeout.apply(self, args);
		});

		return idInfo.timeoutId;
	}
};

exports.clearTimeout = function(clearTimeout){
	return function(timeoutId){
		var args = arguments, self = this;
		return removeTimer(timeoutId, function(){
			return clearTimeout.apply(self, args);
		});
	};
};

exports.setImmediate = function(setImmediate){
	return function(fn){
		var idInfo;
		var zone = CanZone.current;
		var callback = zone.waitFor(function(){
			delete zone.ids[idInfo.id];
			return fn.apply(this, arguments);
		});

		var self = this, args = slice.call(arguments, 1);
		idInfo = addTimer(function(){
			return setImmediate.apply(self, [callback].concat(args));
		});
		return idInfo.timeoutId;
	}
};

exports.clearImmediate = function(clearImmediate){
	return function(immediateId){
		var args = arguments, self = this;
		return removeTimer(immediateId, function(){
			return clearImmediate.apply(self, args);
		});
	};
};

exports.requestAnimationFrame = function(rAF){
	return function(fn){
		var callback = CanZone.current.waitFor(fn);
		return rAF.call(this, callback);
	};
};

exports.then = function(then){
	return function(onFulfilled, onRejected){
		var fn;
		var rejected;
		var callback = CanZone.current.waitFor(function(val){
			if(fn) {
				return fn.apply(this, arguments);
			} else if(rejected) {
				return Promise.reject(val);
			}
			return val;
		}, false);

		var callWith = function(cb, isError){
			return function(){
				fn = cb;
				rejected = !!isError;
				return callback.apply(this, arguments);
			};
		};

		return then.call(this, callWith(onFulfilled),
						 callWith(onRejected, true));
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
			zone = CanZone.current;

		zone.addWait();

		if(supportsOnload && this.onload) {
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
				var task = new CanZone.Task(zone, fn);
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
		var callback = CanZone.current.waitFor(fn);
		var args = slice.call(arguments, 1);
		args.unshift(callback);
		return nextTick.apply(process, args);
	};
};

exports.MutationObserver = function(MutationObserver){
	return function(fn){
		fn = CanZone.current.wrap(fn);
		return new MutationObserver(fn);
	};
};

var EVENT_HANDLER = util.symbol("zone-eventhandler");

exports.addEventListener = function(addEventListener){
	return function(eventName, handler, useCapture){
		var outHandler = handler[EVENT_HANDLER];
		if(outHandler === undefined) {
			outHandler = CanZone.current.wrap(handler);
			handler[EVENT_HANDLER] = outHandler;
		}

		return addEventListener.call(this, eventName, outHandler, useCapture);
	};
};

exports.removeEventListener = function(removeEventListener){
	return function(eventName, handler, useCapture){
		var outHandler = handler[EVENT_HANDLER] || handler;
		return removeEventListener.call(this, eventName, outHandler, useCapture);
	};
};
