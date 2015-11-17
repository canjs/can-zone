var assert = require("assert");
var canWait = require("../can-wait");
var isNode = typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
var g = typeof WorkerGlobalScope !== "undefined" && (self instanceof WorkerGlobalScope)
	? self
	: isNode ? global : window;
if(!isNode) {
	require("steal-mocha");
}
var isBrowser = !isNode;

describe("setTimeout", function(){
	it("basics works", function(done){
		var results = [];
		canWait(function(){
			setTimeout(function(){
				results.push("1-a");
			}, 29);

			setTimeout(function(){
				results.push("1-b");
			}, 13);
		}).then(function(){
			assert.equal(results.length, 2, "Got 2 results");
		}).then(done);

	});
});

describe("setTimeout and XHR", function(){

	if(isBrowser) {
		it("all results returned", function(done){
			var results = [];
			canWait(function(){
				setTimeout(function(){
					results.push("1-a");
				}, 29);

				setTimeout(function(){
					results.push("1-b");
				}, 13);

				var xhr = new XMLHttpRequest();
				xhr.open("GET", "http://chat.donejs.com/api/messages");
				xhr.onload = function(){
					results.push("1-c");
				};
				xhr.send();
			}).then(function(){

				assert.equal(results.length, 3, "Got 3 results");

			}).then(done);
		});

		it("XHR errors are returned", function(done){
			var waits = 0;

			canWait(function(){
				setTimeout(function(){
					waits++;
				});

				var xhr = new XMLHttpRequest();
				xhr.open("GET", "http://chat.donejs.com/api/messages");
				xhr.onreadystatechange = function(){
					if(xhr.readyState === 4) {
						waits++;
					}
				};
				xhr.send();
				xhr.onerror(new Error("oh no"));
			}).then(null, function(errors){

				assert.equal(waits, 2, "Waited for the setTimeout and the xhr");
				assert.equal(errors.length, 1, "There was one error with this request");

			}).then(done);
		});
	}

	it("Rejects when an error occurs in a setTimeout callback", function(done){
		var waits = 0;

		canWait(function(){
			setTimeout(function(){
				throw new Error("ha ha");
			}, 20);
		}).then(null, function(errors){
			assert.equal(errors.length, 1, "There was one error");
			assert.equal(errors[0].message, "ha ha", "Same error object");
		}).then(done);
	});
});

describe("nested setTimeouts", function(){
	beforeEach(function(done){
		var results = this.results = [];

		canWait(function(){
			setTimeout(function(){
				results.push("2-a");

				setTimeout(function(){
					results.push("2-d");
				}, 100);

			}, 4);

			setTimeout(function(){
				results.push("2-b");
			}, 77);

			setTimeout(function(){
				results.push("2-c");
			});
		}).then(done);
	})


	it("all timeouts completed", function(){
		var results = this.results;
		assert.equal(results.length, 4, "There are 4 results");

		assert.equal(results[0], "2-c");
		assert.equal(results[1], "2-a");
		assert.equal(results[2], "2-b");
		assert.equal(results[3], "2-d");
	});

});

if(isBrowser) {
	describe("requestAnimationFrame", function(){
		it("setTimeout with requestAnimationFrame", function(done){
			var results = [];

			canWait(function() {
				setTimeout(function(){
					results.push("3-a");

					requestAnimationFrame(function(){
						results.push("3-d");

						requestAnimationFrame(function(){
							results.push("3-e");
						});
					});
				}, 81);

				setTimeout(function(){
					results.push("3-b");
				}, 32);

				requestAnimationFrame(function(){
					results.push("3-c");
				});
			}).then(function(){
				assert.equal(results.length, 5, "All 5 results completed");
			}).then(done);
		});

	});
}

describe("Promises", function(){

	it("A lot of resolving and rejecting", function(done){
		var results = [];

		canWait(function(){
			Promise.resolve().then(function(){
				results.push("4-a");

				setTimeout(function(){
					results.push("4-b");

					var p = new Promise(function(resolve){
						results.push("4-c");

						Promise.resolve().then(function(){
							results.push("4-d");

							resolve();
						});
					});

					var pp = p.then(function(){
						results.push("4-e");

						return new Promise(function(resolve, reject){
							reject(new Error("Sorry"));
						});
					});

					pp.then(null, function(){
						results.push("4-f");
					});
				});
			});
		}).then(function(){

			assert.equal(results.length, 6, "All 6 promises completed");

		}).then(done);
	});


	it("Throwing in a Promise chain is returned", function(done){
		var caught;
		canWait(function(){
			Promise.resolve().then(function(){
				throw new Error("oh no");
			}).then(null, function(err){
				caught = err;
			});
		}).then(function(){
			assert(true, "Even though a Promise rejected we still get a " +
					 "resolved canWait promise");
			assert(!!caught, "Called the Promise errback");
			assert.equal(caught.message, "oh no", "Correct error object");
		}).then(done);
	});
});

describe("canWait.data", function(){
	it("Calling canWait.data returns data in the Promise", function(done){
		canWait(function(){
			setTimeout(function(){
				Promise.resolve().then(function(){
					g.canWait.data(new Promise(function(resolve){
						setTimeout(function(){
							resolve({ foo: "bar" });
						}, 27);
					}));
				});
			}, 50);
		}).then(function(responses){
			assert.equal(responses.length, 1, "There was one data pushed");
			assert.equal(responses[0].foo, "bar", "got correct response object");
		}).then(done);
	});
});
