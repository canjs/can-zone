var Zone = require("../zone");
var timeout = require("./timeout");
var isNode = require("../env").isNode;
var debugBreak = require("./debug-break");

var debugZone = function(timeoutOrTimeoutZone, options){
	var timeoutZone;
	var argType = typeof timeoutOrTimeoutZone;
	var breakOnTimeout = options && options.break;

	if(argType === "function") {
		timeoutZone = timeoutOrTimeoutZone;
	} else if(argType === "number") {
		timeoutZone = timeout(timeoutOrTimeoutZone);
	} else {
		throw new Error("Must provide either a timeout or a Timeout Zone");
	}


	return function(data){

		var taskFns = {};
		var queue = [];
		var timedOut = false, resetEnd = false;
		var oldEnd;

		return {
			created: function(){
				eachTask(function(name, value, tasks){
					taskFns[name] = value;
					tasks[name] = function(){
						var fn = value.apply(this, arguments);
						return function(){
							var e = new Error();
							var waitFor = Zone.prototype.waitFor;
							Zone.prototype.waitFor = function(providedFn){
								if(breakOnTimeout && timedOut) {
									var userFn = providedFn;
									arguments[0] = function(){
										if(debugZone._testing) {
											return userFn.apply(this, arguments);
										}

										return debugBreak.call(this, userFn, arguments);
									};
								}

								var waitFn = waitFor.apply(this, arguments);
								var wrapped = function(){
									var idx = queue.indexOf(wrapped);
									queue.splice(idx, 1);

									return waitFn.apply(this, arguments);
								};
								wrapped.__debugInfo = {
									e: e,
									task: getTaskName(name)
								};
								queue.push(wrapped);
								return wrapped;
							};
							var res = fn.apply(this, arguments);
							Zone.prototype.waitFor = waitFor;
							return res;
						};
					};
				});
			},

			ended: function(){
				eachTask(function(name, value, tasks){
					tasks[name] = taskFns[name];
				});
			},

			beforeTimeout: function(){
				timedOut = true;
				var infos = queue.map(function(fn){
					var info = fn.__debugInfo;
					return {
						task: info.task,
						// Deleting the first two lines because it has our own
						// function calls
						stack: deleteLines(info.e.stack, [1,2])
					};
				});
				data.debugInfo = infos;
				queue = [];

				// On break, override `zone.end` so that the timeout zone
				// Doesn't end the zone prematurely.
				if(breakOnTimeout) {
					oldEnd = this.end;
					this.end = Function.prototype;
				}
			},

			afterTask: function() {
				// break: true prevents
				if(breakOnTimeout && timedOut && !resetEnd) {
					this.end = oldEnd;
					this.errors.length = 0;
					resetEnd = true;

				}
			},

			plugins: [timeoutZone]
		};
	};
};

module.exports = debugZone;

var taskNameMap = {
	then: "Promise"
};
function getTaskName(name) {
	return taskNameMap[name] || name;
}

function eachTask(callback){
	var tasks = Zone.tasks;
	for(var t in tasks) {
		callback(t, tasks[t], tasks);
	}
}

function deleteLines(str, lines){
	var parts = str.split("\n");
	// v8 Includes an "Error" line by itself but Firefox does not
	// This determines where we start deleting lines from.
	var hasPrecedingMsg = parts[0] !== "Error";
	var haveCut = false;

	while(lines.length) {
		var line = lines.shift();
		if(haveCut) {
			line--;
		}
		if(hasPrecedingMsg) {
			line--;
		}
		parts.splice(line, 1);
		haveCut = true;
	}

	return parts.join("\n");
}
