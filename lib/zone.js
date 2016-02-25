var g = require("./env").global;

// Keep a local reference since we will be overriding this later.
var Promise = g.Promise;

var globalsZone = require("./zones/globals");
var forEach = require("./util").forEach;

var slice = Array.prototype.slice;

function Deferred(){
	var dfd = this;
	this.promise = new Promise(function(resolve, reject){
		dfd.resolve = resolve;
		dfd.reject = reject;
	});
}

function Task(zone, fn, catchErrors, nestedTask){
	this.zone = zone;
	this.fn = fn;
	this.catchErrors = catchErrors;
	this.nestedTask = nestedTask;
}

Task.prototype.run = function(ctx, args){
	var previousZone = Zone.current;
	var zone = Zone.current = this.zone;
	zone.execHook("beforeTask", this);

	var res;
	try {
		zone.runningTask = true;
		res = this.fn.apply(ctx, args);
		Zone.current = previousZone;
		zone.execHook("afterTask", this);
	} catch(err) {
		Zone.current = previousZone;
		zone.execHook("afterTask", this);
		if(this.catchErrors !== false) {
			zone.errors.push(err);
		} else {
			throw err;
		}
	}
	// If this is a nested task (a task run synchronously then this will
	// remain as true
	zone.runningTask = this.nestedTask;

	return res;
};

var hooks = [
	"beforeTask",
	"afterTask",
	"created"
];

var commonGlobals = [
	"document",
	"window",
	"location"
];

function buildZoneSpec(zone, spec, plugins){
	spec = spec || {};

	plugins = plugins || [];
	if(typeof spec === "function") {
		spec = spec(zone.data);
	}

	// Depth-first, call all of the plugins.
	if(spec.plugins){
		plugins = plugins.concat(spec.plugins);
	}
	forEach.call(plugins, function(plugin){
		buildZoneSpec(zone, plugin);
	});

	forEach.call(hooks, function(hook){
		var propName = hook + "s";
		var array = zone[propName];
		if(!array) {
			array = zone[propName] = [];
		}

		if(spec[hook]) {
			array.push(spec[hook]);
		}
	});

	var globals = extend({}, spec.globals || {});
	// Add in the common globals that can go directly on the spec
	forEach.call(commonGlobals, function(name){
		if(spec[name]) globals[name] = spec[name];
	});
	for(var p in globals) {
		zone.globals[p] = globals[p];
	}
}

function Zone(spec) {
	spec = spec || {};
	this.deferred = new Deferred();
	this.waits = 0;
	this.ids = {};
	this.errors = [];
	this.data = {};
	this.globals = {};

	buildZoneSpec(this, spec, [globalsZone]);

	this.execHook("created");
}

Zone.waitFor = function(fn, catchErrors){
	var zone = Zone.current;
	if(!zone) return fn;
	return zone.wrapAndWait(fn, catchErrors);
};

Zone.error = function(error){
	var zone = Zone.current;
	if(!zone) return error;
	zone.errors.push(error);
	return error;
};

Zone.ignore = function(fn){
	var zone = Zone.current;
	if(!zone) return fn;
	return zone.ignore(fn);
};

Zone.prototype.runTask = function(fn, ctx, args, catchErrors){
	var res, error;
	var alreadyRunning = this.runningTask;
	var task = new Task(this, fn, catchErrors, alreadyRunning);
	try {
		res = task.run(ctx, args);
	} catch(err) {
		error = err;
	}
	if(this.removeWait)
		this.removeWait();
	if(error)
		throw error;
	return res;
};

Zone.prototype.run = function(fn){
	var task = new Task(this, fn);

	// Call the function
	this.data.result = task.run();

	// If we are already done
	if(!this.waits || this.errors.length) {
		this.end();
	}

	return this.deferred.promise;
};

Zone.prototype.fork = function(zoneSpec){
	var plugins = [];
	if(zoneSpec) plugins.push(zoneSpec);
	plugins.unshift(this);
	var newZone = new Zone({
		plugins: plugins
	});

	return newZone;
};

Zone.prototype.execHook = function(hook /* , args */){
	var args = slice.call(arguments, 1);
	var zone = this;
	var prop = hook + "s";
	var array = this[prop];
	if(array){
		forEach.call(array, function(fn){
			fn.apply(zone, args);
		});
	}
};

Zone.prototype.wrap = function(fn, catchErrors){
	var zone = this;

	return function(){
		return zone.runTask(fn, this, arguments, catchErrors);
	};
};

Zone.prototype.end = function(){
	var dfd = this.deferred;
	if(this.errors.length) {
		var error = this.errors[0];
		error.errors = this.errors;
		dfd.reject(error);
	} else {
		dfd.resolve(this.data);
	}
};

Zone.prototype.wrapAndWait = function(){
	this.addWait();
	return this.wrap.apply(this, arguments);
};

Zone.prototype.ignore = function(fn){
	return function(){
		var zone = Zone.current;
		if(!zone) {
			return fn.apply(this, arguments);
		}

		// Use the original versions
		var task = new Task(zone);

		zone.execHook("afterTask", task);
		var res = fn.apply(this, arguments);
		zone.execHook("beforeTask", task);
		return res;
	};
};

Zone.prototype.addWait = function(){
	this.waits++;
};

Zone.prototype.removeWait = function(){
	this.waits--;
	if(this.waits === 0) {
		this.end();
	}
};

Zone.Task = Task;

function extend(a, b){
	if(!b) return a;
	for(var p in b) {
		a[p] = b[p];
	}
	return a;
}

canWait.Zone = Zone;
canWait.Task = Task;

function canWait(fn, spec) {
	return new Zone(spec).run(fn);
}

g.Zone = g.Zone || Zone;

if(typeof module !== "undefined" && module.exports) {
	module.exports = canWait;
}
