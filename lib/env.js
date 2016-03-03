var isNode = typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
var g = typeof WorkerGlobalScope !== "undefined" && (self instanceof WorkerGlobalScope)
	? self
	: isNode
	? global
	: window;

exports.isNode = isNode;
exports.global = g;
