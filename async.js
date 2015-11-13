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


function waitUntilEmpty(fn) {
	var promises = [];

	var overrides = [];
	overrides.push(overrideSetTimeout(promises));

	// Call the function
	fn();

	if(promises.length) {
		return Promise.all(promises).then(function(){
			overrides.forEach(function(override){
				override.release();
			});
		});
	}
	return Promise.resolve();
}
