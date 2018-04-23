var isNode = typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
var nodeRequire = typeof System !== "undefined" && System._nodeRequire ?
	System._nodeRequire : typeof require === "function" ? require : function(){};
var isNW = isNode && (function(){
  try {
	return nodeRequire("nw.gui") !== "undefined";
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
