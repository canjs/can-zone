
var waitFor = exports["default"] = exports.waitFor = function(fn){
	if(canWaitPresent()) {
		return canWait.apply(this, arguments);
	}
	return fn;
};

// ES6
exports.__useDefault = true;
exports.__esModule = true;

exports.waitData = exports.data = waitFor.waitData = waitFor.data = function(data){
	if(canWaitPresent()) {
		return canWait.data.apply(canWait, arguments);
	}
	return data;
};

exports.waitError = exports.error = waitFor.waitError = waitFor.error = function(error){
	if(canWaitPresent()) {
		return canWait.error.apply(canWait, arguments);
	}
	return error;
};

function canWaitPresent(){
	return typeof canWait !== "undefined" && !!canWait.data;
}

if(typeof steal === "undefined") {
	module.exports = waitFor;
}
