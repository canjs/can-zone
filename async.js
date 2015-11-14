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

function Override(obj, name, fn, promises) {
	this.old = obj[name];
	this.obj = obj;
	this.name = name;
	obj[name] = fn(this.old, promises);
}

Override.prototype.release = function(){
	this.obj[this.name] = this.old;
};

var overrideSetTimeout = function(promises){
	return new Override(g, "setTimeout", function(setTimeout){
		return function(fn, timeout){
			var dfd = new Deferred();
			promises.push(dfd.promise);

			return setTimeout.call(this, function(){
				dfd.resolve();
				return fn.apply(this, arguments);
			}, timeout);
		}
	});
};

function OverrideCollection(promises) {
	this.promises = [];
	var o = this.overrides = [];
	o.push(overrideSetTimeout(promises));
}

OverrideCollection.prototype.release = function(){
	var o = this.overrides;
	for(var i = 0, len = o.length; i < len; i++) {
		o[i].release();
	}
};

function canWait(fn) {
	var promises = [];
	var thunks = [];

	var overrides = new OverrideCollection(thunks);

	// Call the function
	fn();
	overrides.release();

	function waitOnAll() {
		if(promises.length) {
			var waiting = [].slice.call(promises);
			promises.length = 0;

			return Promise.all(waiting).then(waitOnAll);
		}
		return Promise.resolve();
	}
	return waitOnAll();
}
