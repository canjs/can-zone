var assert = require("assert");
var timeoutZone = require("../timeout");
var TimeoutError = timeoutZone.TimeoutError;

describe("Timeout Zone", function(){

	describe("Calling the plugin", function(){
		it("Returns a ZoneSpec function", function(){
			var zonePlugin = timeoutZone(10);
			assert.equal(typeof zonePlugin, "function", "Returns a function");
		});

		it("Throws if you do not provide it a timeout", function(){
			assert.throws(function(){
				timeoutZone();
			}, "Must provide a timeout in milliseconds");
		});

		it("Works with a timeout of 0", function(){
			assert.doesNotThrow(function(){
				timeoutZone(0);
			});
		});
	});

	it("Zone is rejected when the timeout is exceeded", function(done){
		var zone = new Zone(timeoutZone(10));
		zone.run(function(){
			setTimeout(function(){}, 15);
		}).then(null, function(err){
			assert.ok(err instanceof TimeoutError, "Error is a TimeoutError");
		}).then(done, done);
	});

	it("Zone is resolved if it beats the timeout", function(done){
		var zone = new Zone(timeoutZone(10));
		zone.run(function(){
			setTimeout(function(){});
		}).then(function(){
			done();
		}, function(err){
			done(err);
		});
	});

	it("defines a beforeTimeout hook that is called just prior to a timeout", function(done){
		var myZone = function(data){
			return {
				beforeTimeout: function(){
					data.worked = true;
				},
				plugins: [timeoutZone(10)]
			}
		};

		var zone = new Zone(myZone);
		zone.run(function(){
			setTimeout(function(){}, 50);
		}).then(null, function(){
			assert.ok(zone.data.worked, "it worked");
		}).then(done, done);
	});

	it("works in a nested Zone", function(done){
		var zone = new Zone(timeoutZone(10));
		var innerPromise;

		var outerPromise = zone.run(function(){
			innerPromise = new Zone().run(function(){
				setTimeout(function(){}, 20);
			});
		});

		assert.ok(innerPromise, "inner promise is immediately defined");

		Promise.race([
			innerPromise,
			outerPromise
		]).then(null, function(err){
			assert.ok(err instanceof TimeoutError, "it timed out");
			innerPromise.then(function(){
				assert.ok("inner eventually completed");
				done();
			});
		});
	});
});
