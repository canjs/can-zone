var assert = require("assert");
var wait = require("../can-wait");
var ignore = require("../ignore");

describe("can-wait/ignore", function(){
	it("allows you to ignore function calls", function(done){
		function io(){
			setTimeout(function(){

			}, 20);
		}

		wait(function(){
			setTimeout(function(){
				var fn = ignore(io);

				var request = canWait.currentRequest;
				assert.equal(request.waits, 1, "Waiting on the currect task");
				fn();
				assert.equal(request.waits, 1, "No new waits were added");

				setTimeout(function(){
					canWait.data("a");
				}, 30);
			});
		}).then(function(responses){
			assert.equal(responses[0], "a", "calls after the ignored function are handled");
		}).then(done);
	});
});
