var assert = require("assert");
var timeoutZone = require("../timeout");

describe("Timeout Zone", function(){

	it("Creates a timeout function", function(){
		var zone = new Zone(timeoutZone);

		assert.equal(typeof zone.timeout, "function",
			   "The timeout zone created a timeout method");
	});

	it("timeoutPromise resolves when the timeout is exceeded", function(done){
		var zone = new Zone(timeoutZone);
		var timeoutPromise = zone.timeout(10);
		var runPromise = zone.run(function(){
			setTimeout(function(){}, 15);
		});

		var timedOut = false;
		timeoutPromise.then(function(){
			timedOut = true;
		});

		runPromise.then(function(){
			assert.ok(timedOut, "This timed out before run finished");
		}).then(done);
	});

	it("timeoutPromise never resolves if run does complete", function(done){
		var zone = new Zone(timeoutZone);
		var timeoutPromise = zone.timeout(10);
		var runPromise = zone.run(function(){
			setTimeout(function(){});
		});

		var timedOut = false;
		timeoutPromise.then(function(){
			timedOut = true;
		});
		runPromise.then(function(){
			assert.ok(!timedOut, "Didn't time out");

			// Wait past the timeout
			setTimeout(function(){
				assert.ok(!timedOut, "Still did not timeout");
				done();
			}, 20);
		});
	});

	it(".timeout can be called after .run", function(done){
		var zone = new Zone(timeoutZone);
		var runPromise = zone.run(function(){
			setTimeout(function(){}, 15);
		});
		var timeoutPromise = zone.timeout(10);

		var timedOut = false;
		timeoutPromise.then(function(){
			timedOut = true;
		});

		runPromise.then(function(){
			assert.ok(timedOut, "It timed out");
			done();
		});
	});
});
