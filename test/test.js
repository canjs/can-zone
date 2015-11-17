var canWait = require("can-wait");
var QUnit = require("steal-qunit");
var g = typeof WorkerGlobalScope !== "undefined" && (self instanceof WorkerGlobalScope)
	? self
	: typeof process !== "undefined" && {}.toString.call(process) === "[object process]"
	? global
	: window;

QUnit.module("setTimeout and XHR");

QUnit.test("all results returned", function(){
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

		QUnit.equal(results.length, 3, "Got 3 results");

	}).then(QUnit.start);

	QUnit.stop();
});

QUnit.test("XHR errors are returned", function(){
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

		QUnit.equal(waits, 2, "Waited for the setTimeout and the xhr");
		QUnit.equal(errors.length, 1, "There was one error with this request");

	}).then(QUnit.start);

	QUnit.stop();
});

QUnit.test("Rejects when an error occurs in a setTimeout callback", function(){
	var waits = 0;

	canWait(function(){
		setTimeout(function(){
			throw new Error("ha ha");
		}, 20);
	}).then(null, function(errors){
		QUnit.equal(errors.length, 1, "There was one error");
		QUnit.equal(errors[0].message, "ha ha", "Same error object");
	}).then(QUnit.start);

	QUnit.stop();
});

QUnit.module("nested setTimeouts", {
	beforeEach: function(test){
		var results = this.results = [];
		var done = test.async();

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
	}
});

QUnit.test("all timeouts completed", function(){
	var results = this.results;
	QUnit.equal(results.length, 4, "There are 4 results");

	QUnit.equal(results[0], "2-c");
	QUnit.equal(results[1], "2-a");
	QUnit.equal(results[2], "2-b");
	QUnit.equal(results[3], "2-d");

});

QUnit.module("requestAnimationFrame");

QUnit.test("setTimeout with requestAnimationFrame", function(){
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
		QUnit.equal(results.length, 5, "All 5 results completed");
	}).then(QUnit.start);

	QUnit.stop();
});

QUnit.module("Promises");

QUnit.test("A lot of resolving and rejecting", function(){
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

		QUnit.equal(results.length, 6, "All 6 promises completed");

	}).then(QUnit.start);

	QUnit.stop();
});

QUnit.test("Throwing in a Promise chain is returned", function(){
	var caught;
	canWait(function(){
		Promise.resolve().then(function(){
			throw new Error("oh no");
		}).then(null, function(err){
			caught = err;
		});
	}).then(function(){
		QUnit.ok(true, "Even though a Promise rejected we still get a " +
				 "resolved canWait promise");
		QUnit.ok(!!caught, "Called the Promise errback");
		QUnit.equal(caught.message, "oh no", "Correct error object");
	}).then(QUnit.start);

	QUnit.stop();
});

QUnit.module("canWait.data");

QUnit.test("Calling canWait.data returns data in the Promise", function(){

	canWait(function(){
		setTimeout(function(){
			requestAnimationFrame(function(){
				g.canWait.data(new Promise(function(resolve){
					setTimeout(function(){
						resolve({ foo: "bar" });
					}, 27);
				}));
			});
		}, 50);
	}).then(function(responses){
		QUnit.equal(responses.length, 1, "There was one data pushed");
		QUnit.equal(responses[0].foo, "bar", "got correct response object");
	}).then(QUnit.start);

	QUnit.stop();
});
