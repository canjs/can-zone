var assert = require("assert");
var debugZone = require("../debug");
var timeout = require("../timeout");

describe("Debug Zone", function(){
	describe("Main API", function(){
		it("can take a timeoutZone", function(){
			assert.doesNotThrow(function(){
				var zone = new Zone(debugZone(timeout(10)));
			});
		});

		it("can take a timeout in milliseconds", function(){
			assert.doesNotThrow(function(){
				var zone = new Zone(debugZone(10));
			});
		});

		it("throws otherwise", function(){
			assert.throws(function(){
				var zone = new Zone(debugZone());
			});
		});
	});

	describe("Wrapping tasks", function(){
		beforeEach(function(){
			this.taskSetTimeout = Zone.tasks.setTimeout;
		});

		it("Cleans up after itself", function(done){
			var zone = new Zone(debugZone(10));
			var test = this;

			zone.run(function(){}).then(function(){
				assert.equal(Zone.tasks.setTimeout, test.taskSetTimeout,
							 "was reset");
				done();
			});

		});
	});

	it("Gives you a stack trace", function(done){
		var zone = new Zone(debugZone(30));

		zone.run(function(){
			function someFunc(){
				setTimeout(function(){}, 50);
			}
			someFunc();
		}).then(null, function(err){
			var info = zone.data.debugInfo;

			assert.ok(info, "Zone has a debugInfo");
			assert.equal(info.length, 1, "has one info");
			assert.equal(info[0].task, "setTimeout", "has info on a setTimeout");
			assert.ok(/someFunc/.test(info[0].stack), "has someFunc in the stack");
		}).then(done, done);
	});

	it("Doesn't include debug info when a task does complete", function(done){
		var zone = new Zone(debugZone(10));

		zone.run(function(){
			setTimeout(function(){});
			setTimeout(function(){}, 30);
		}).then(null, function(){
			var info = zone.data.debugInfo;

			assert.equal(info.length, 1, "There is only 1 item in the debug info");
		}).then(done, done);
	});

	it("Includes debug info for the tasks that did not complete", function(done){
		var zone = new Zone(debugZone(20));

		zone.run(function(){
			setTimeout(function(){}, 1);

			function someFunc(){
				setTimeout(function(){}, 50);
			}
			someFunc();

			function makePromise(){
				var p = new Promise(function(){});
				return p.then(function(){
					Zone.current.data.failed = true;
				});
			}
			makePromise();
		}).then(null, function(){
			var info = zone.data.debugInfo;

			assert.equal(info.length, 2, "There were two timed out tasks");

			var stInfo = info[0];
			assert.equal(stInfo.task, "setTimeout", "this is for the setTimeout");
			assert.ok(/someFunc/.test(stInfo.stack), "contains right function call");

			var pInfo = info[1];
			assert.equal(pInfo.task, "Promise", "this is for the Promise");
			assert.ok(/makePromise/.test(pInfo.stack), "contains the right function call");
		}).then(done, done);

	});
});

