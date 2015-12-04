
var waitFor = exports["default"] = function(fn){
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

function canWaitPresent(){
	return typeof canWait !== "undefined" && !!canWait.data;
}
