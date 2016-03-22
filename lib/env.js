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
var g = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ?
	self :
	isNW ? window :
	isNode ? global : window;

exports.isNode = isNode;
exports.isNW = isNW;
exports.global = g;
