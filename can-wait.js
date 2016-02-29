var isNode = typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
var g = typeof WorkerGlobalScope !== "undefined" && (self instanceof WorkerGlobalScope)
	? self
	: isNode
	? global
	: window;

// Keep a local reference since we will be overriding this later.
var Promise = g.Promise;

var slice = Array.prototype.slice;

function Deferred(){
	var dfd = this;
	this.promise = new Promise(function(resolve, reject){
		dfd.resolve = resolve;
		dfd.reject = reject;
	});
}

var waitWithinRequest = g.canWait = g.canWait || function(fn, catchErrors){
	var request = waitWithinRequest.currentRequest;
	if(!request) return fn;
	request.addWait();

	return function(){
		return request.runTask(fn, this, arguments, catchErrors);
	};
};

waitWithinRequest.data = waitWithinRequest.data || function(dataOrPromise){
	var request = waitWithinRequest.currentRequest;
	if(!request) return dataOrPromise;
	var save = function(data){
		request.responses.push(data);
		return data;
	};
	if(dataOrPromise && dataOrPromise.then){
		return dataOrPromise.then(save);
	}
	return save(dataOrPromise);
};

waitWithinRequest.error = waitWithinRequest.error || function(error){
	var request = waitWithinRequest.currentRequest;
	if(!request) return error;
	request.errors.push(error);
	return error;
};

function Override(obj, name, fn) {
	this.oldValue = obj[name];
	this.obj = obj;
	this.name = name;
	this.value = fn(this.oldValue, this);
}

Override.prototype.trap = function(){
	this.obj[this.name] = this.value;
};

Override.prototype.release = function(){
	this.obj[this.name] = this.oldValue;
};

canWait.Override = Override;

if(isNode) {
	var globalTimeoutId = 1;
}

var allOverrides = [
	function(request){
		return new Override(g, "setTimeout", function(setTimeout){
			return function(fn, timeout){
				var callback = waitWithinRequest(function(){
					delete request.ids[id];
					return fn.apply(this, arguments);
				});
				var timeoutId = setTimeout.call(this, callback, timeout);
				var id = timeoutId;
				if(isNode) {
					id = timeoutId.__timeoutId = globalTimeoutId++;
				}
				request.ids[id] = timeoutId;
				return timeoutId;
			}
		});
	},

	function(request){
		return new Override(g, "clearTimeout", function(clearTimeout){
			return function(timeoutId){
				// If no timeoutId is passed just call the parent
				// https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout#Notes
				if(timeoutId == null) {
					return clearTimeout.apply(this, arguments);
				}

				var ids = request.ids;
				var id = isNode ? timeoutId.__timeoutId : timeoutId;
				if(ids[id]) {
					delete ids[id];
					request.waits--;

				}
				return clearTimeout.apply(this, arguments);
			};
		});
	},

	function(request){
		return typeof requestAnimationFrame === "undefined" ?
			undefined :

		new Override(g, "requestAnimationFrame", function(rAF){
			return function(fn){
				var callback = waitWithinRequest(fn);
				return rAF.call(this, callback);
			};
		});
	},

	function(request) {
		return new Override(g.Promise.prototype, "then", function(then){
			return function(onFulfilled, onRejected){
				var fn;
				var callback = waitWithinRequest(function(val){
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

	function(request){
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

				var request = waitWithinRequest.currentRequest;
				request.addWait();

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
						var task = new Task(request, fn);
						var res = task.run(this, arguments);
						request.removeWait();
						return res;
					};
				}

				return send.apply(this, arguments);
			};
		});
	},

	function(request){
		return typeof process === "undefined" || !process.nextTick ?
			undefined :

		new Override(process, "nextTick", function(nextTick){
			return function(fn/*, ...args */){
				var callback = waitWithinRequest(fn);
				var args = slice.call(arguments, 1);
				args.unshift(callback);
				return nextTick.apply(process, args);
			};
		});
	}

];

function Task(request, fn, catchErrors, nestedTask){
	this.request = request;
	this.fn = fn;
	this.catchErrors = catchErrors;
	this.nestedTask = nestedTask;
}

Task.prototype.run = function(ctx, args){
	var request = this.request;
	this.trap();

	var res;
	try {
		request.runningTask = true;
		res = this.fn.apply(ctx, args);
		this.release();
	} catch(err) {
		this.release();
		if(this.catchErrors !== false) {
			request.errors.push(err);
		} else {
			throw err;
		}
	}
	// If this is a nested task (a task run synchronously then this will
	// remain as true
	request.runningTask = this.nestedTask;

	return res;
};

Task.prototype.trap = function(){
	if(this.nestedTask) return;
	var request = this.request;
	waitWithinRequest.previousRequest = waitWithinRequest.currentRequest;
	waitWithinRequest.currentRequest = request;
	var o = request.overrides;
	for(var i = 0, len = o.length; i < len; i++) {
		o[i].trap();
	}
};

Task.prototype.release = function(){
	if(this.nestedTask) return;
	var o = this.request.overrides;
	for(var i = 0, len = o.length; i < len; i++) {
		o[i].release();
	}
	waitWithinRequest.currentRequest = waitWithinRequest.previousRequest;
	waitWithinRequest.previousRequest = undefined;
};

function Request(options) {
	this.deferred = new Deferred();
	this.waits = 0;
	this.ids = {};
	this.errors = [];
	this.responses = [];
	var o = this.overrides = [], def;

	var localOverrides = ((options && options.overrides)||[])
		.concat(allOverrides);

	for(var i = 0, len = localOverrides.length; i < len; i++) {
		def = localOverrides[i](this);
		if(def)
			o.push(def);
	}
}

Request.prototype.runTask = function(fn, ctx, args, catchErrors){
	var res, error;
	var alreadyRunning = this.runningTask;
	var task = new Task(this, fn, catchErrors, alreadyRunning);
	try {
		res = task.run(ctx, args);
	} catch(err) {
		error = err;
	}
	this.removeWait();
	if(error)
		throw error;
	return res;
};

Request.prototype.end = function(){
	var dfd = this.deferred;
	if(this.errors.length) {
		dfd.reject(this.errors);
	} else if(this.responses.length) {
		dfd.resolve(this.responses);
	} else {
		dfd.resolve();
	}
};

Request.prototype.addWait = function(){
	this.waits++;
};

Request.prototype.removeWait = function(){
	this.waits--;
	if(this.waits === 0) {
		this.end();
	}
};

Request.Task = Task;

function canWait(fn, options) {
	var request = new Request(options);
	var task = new Task(request, fn);

	// Call the function
	task.run();

	if ( request.waits === 0 ) {
		request.end();
	}

	return request.deferred.promise;
}

if(typeof module !== "undefined" && module.exports) {
	module.exports = canWait;
}
