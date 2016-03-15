var util = require("../util");
var env = require("../env");
var g = env.global;

if(env.isNode) {
	var globalTimeoutId = 1;
}

module.exports = function(){
	var globals, overrides = [];

	return {
		name: "globals",
		plugins: [promiseZone],
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

function promiseZone(){
	var promiseThen = function(){
		if(!Zone.current || oldPromiseThen.zoneWrapped) {
			return oldPromiseThen.apply(this, arguments);
		}
		return Zone.tasks.then(oldPromiseThen).apply(this, arguments);
	}, oldPromiseThen;

	return {
		beforeTask: function(task){
			if(task.nestedTask) return;
			oldPromiseThen = Promise.prototype.then;
			Promise.prototype.then = promiseThen;
		},
		afterTask: function(task){
			if(task.nestedTask) return;
			Promise.prototype.then = oldPromiseThen;
		}
	};

}
