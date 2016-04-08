exports = module.exports = function(timeout){
	if(typeof timeout !== "number") {
		throw new Error("Must provide a timeout in milliseconds");
	}

	return function(data){
		var timeoutId;

		return {
			beforeRun: function(){
				var zone = this;
				timeoutId = setTimeout(function(){
					zone.execHook("beforeTimeout");
					zone.errors.unshift(new TimeoutError(timeout));
					zone.end();
				}, timeout);
			},

			ended: function(){
				clearTimeout(timeoutId);
			},

			hooks: ["beforeTimeout"]
		};
	};
};

var TimeoutError = exports.TimeoutError = function(timeout){
	Error.call(this, "This zone exceeded a timeout of", timeout);
	this.timeout = timeout;
};

TimeoutError.prototype = new Error();
TimeoutError.prototype.constructor = TimeoutError;
