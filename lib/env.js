"use strict";
var isNode = typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
var nodeRequire = typeof System !== "undefined" && System._nodeRequire ?
	System._nodeRequire : typeof require === "function" ? require : function(){};
var isNW = isNode && (function(){
	try {
		var requireAlias = "require";
		if(typeof System !== "undefined" && System._nodeRequire) {
			return System._nodeRequire("nw.gui") !== "undefined";
		} else if(typeof global === "object" && global[requireAlias]) {
			return global[requireAlias]("nw.gui") !== "undefined";
		} else {
			return false;
		}
	} catch(e) {
		return false;
	}
})();
var isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
var g = isWorker ?
	self :
	isNW ? window :
	isNode ? global : window;

exports.isNode = isNode;
exports.isNW = isNW;
exports.isWorker = isWorker;
exports.global = g;
