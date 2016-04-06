module.exports = function(){
	var timeout, timeoutId, dfd;
	var zoneRunning = false;

	var startTimer = (function(){
		var started = false;
		return function(){
			if(started || !zoneRunning) {
				return;
			}
			timeoutId = setTimeout(function(){
				dfd.resolve();
			}, timeout);
		};
	})();

	return {
		created: function(){
			dfd = new Deferred();
			this.timeout = function(ms){
				timeout = ms;
				startTimer();
				return dfd.promise;
			};
		},

		beforeRun: function(){
			zoneRunning = true;
			startTimer();
		},

		ended: function(){
			clearTimeout(timeoutId);
		}
	};
};

function Deferred(){
	var dfd = this;
	this.promise = new Promise(function(resolve, reject){
		dfd.resolve = resolve;
		dfd.reject = reject;
	});
}
