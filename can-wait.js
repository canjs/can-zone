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

var overrideSetTimeout = function(overrides){
	return new Override(g, "setTimeout", function(setTimeout){
		return function(fn, timeout){
			var dfd = new Deferred();
			overrides.promises.push(dfd.promise);

			return setTimeout.call(this, function(){
				return overrides.run(fn, dfd);
			}, timeout);
		}
	});
};

var overrideRAF = function(overrides){
	return new Override(g, "requestAnimationFrame", function(rAF){
		return function(fn){
			var dfd = new Deferred();
			overrides.promises.push(dfd.promise);

			return rAF.call(this, function(){
				return overrides.run(fn, dfd);
			});
		};
	});
};

function OverrideCollection() {
	this.promises = [];
	var o = this.overrides = [];

	o.push(overrideSetTimeout(this));
	o.push(overrideRAF(this));
}

OverrideCollection.prototype.trap = function(){
	var o = this.overrides;
	for(var i = 0, len = o.length; i < len; i++) {
		o[i].trap();
	}
};

OverrideCollection.prototype.release = function(){
	var o = this.overrides;
	for(var i = 0, len = o.length; i < len; i++) {
		o[i].release();
	}
};

OverrideCollection.prototype.run = function(fn, dfd){
	this.trap();
	var res = fn();
	this.release();
	if(dfd)
		dfd.resolve();
	return res;
};

function canWait(fn) {
	var overrides = new OverrideCollection();

	// Call the function
	overrides.run(fn);

	function waitOnAll() {
		var promises = overrides.promises;
		if(promises.length) {
			var waiting = [].slice.call(promises);
			promises.length = 0;

			return Promise.all(waiting).then(waitOnAll);
		}
		return Promise.resolve();
	}
	return waitOnAll();
}

if(typeof module !== "undefined" && module.exports) {
	module.exports = canWait;
}
