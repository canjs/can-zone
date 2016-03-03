
exports.forEach = Array.prototype.forEach || function(fn){
	for(var i = 0, len = this.length; i < len; i++) {
		fn.call(this, this[i], i);
	}
};

var supportsSymbol = typeof Symbol === "function";
exports.symbol = function(str){
	return supportsSymbol ? Symbol(str) : str;
};

exports.defineProperty = function(obj, prop, defn){
	if(Object.defineProperty) {
		Object.defineProperty(obj, prop, defn);
	} else {
		obj[prop] = defn.value;
	}
};
