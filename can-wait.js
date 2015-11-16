var g = typeof WorkerGlobalScope !== "undefined" && (self instanceof WorkerGlobalScope)
	? self
	: typeof process !== "undefined" && {}.toString.call(process) === "[object process]"
	? global
	: window;

function Deferred(){
	var dfd = this;
	this.promise = new Promise(function(resolve, reject){
		dfd.resolve = resolve;
		dfd.reject = reject;
	});
}

var waitWithinRequest = g.canWait = function(fn){
	var request = waitWithinRequest.currentRequest;
	request.waits++;

	return function(){
		return request.run(fn, this, arguments);
	};
};

function Override(obj, name, fn) {
	this.old = obj[name];
	this.obj = obj;
	this.name = name;
	this.fn = fn(this.old, this);
}

Override.prototype.trap = function(){
	this.obj[this.name] = this.fn;
};

Override.prototype.release = function(){
	this.obj[this.name] = this.old;
};

var overrideSetTimeout = function(request){
	return new Override(g, "setTimeout", function(setTimeout){
		return function(fn, timeout){
			var callback = waitWithinRequest(fn);
			return setTimeout.call(this, callback, timeout);
		}
	});
};

var overrideRAF = function(request){
	return new Override(g, "requestAnimationFrame", function(rAF){
		return function(fn){
			var callback = waitWithinRequest(fn);
			return rAF.call(this, callback);
		};
	});
};

var overrideXHR = function(request){
	return new Override(XMLHttpRequest.prototype, "send", function(send){
		return function(){
			var onreadystatechange = this.onreadystatechange,
				onload = this.onload,
				onerror = this.onerror,
				error;

			var request = waitWithinRequest.currentRequest;
			var callback = waitWithinRequest(function(){
				if(this.readyState === 4) {
					onreadystatechange && onreadystatechange.apply(this, arguments);

					if(error)
						onerror && onerror.apply(this, arguments);
					else
						onload && onload.apply(this, arguments);
				} else {
					request.waits++;
				}
			});
			this.onreadystatechange = callback;
			this.onerror = function(err){ error = err };

			return send.apply(this, arguments);
		};
	});
};

function Request() {
	this.deferred = new Deferred();
	this.promises = [];
	this.waits = 0;
	var o = this.overrides = [];

	o.push(overrideSetTimeout(this));
	o.push(overrideRAF(this));
	o.push(overrideXHR(this));
}

Request.prototype.trap = function(){
	var o = this.overrides;
	for(var i = 0, len = o.length; i < len; i++) {
		o[i].trap();
	}
};

Request.prototype.release = function(){
	var o = this.overrides;
	for(var i = 0, len = o.length; i < len; i++) {
		o[i].release();
	}
};

Request.prototype.run = function(fn, ctx, args){
	var res = this.runWithinScope(fn, ctx, args);
	this.waits--;
	if(this.waits === 0) {
		this.deferred.resolve();
	}
	return res;
};

Request.prototype.runWithinScope = function(fn, ctx, args){
	waitWithinRequest.currentRequest = this;
	this.trap();
	var res = fn.apply(ctx, args);
	this.release();
	return res;
};

function canWait(fn) {
	var request = new Request();

	// Call the function
	request.runWithinScope(fn);

	return request.deferred.promise;
}

if(typeof module !== "undefined" && module.exports) {
	module.exports = canWait;
}
