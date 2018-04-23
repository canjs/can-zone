var steal = require("@steal");
var mocha = require("steal-mocha");
var assert = require("assert");


var workerUrl = steal.loader.stealURL + "?main=~/test/worker_main";
var worker = new Worker(workerUrl);

worker.addEventListener("message", function onMsg(ev){
	var msg = ev.data;

	switch(msg.type) {
		case "suites":
			defineSuites(ev.data.suites);
			break;
		case "test":
			setTestResults(ev.data);
			break;
	}
});

var testMap = new Map();

function clearUI() {
	var stats = document.getElementById("mocha-stats");
	var report = document.getElementById("mocha-report");
	stats.parentNode.removeChild(stats);
	report.parentNode.removeChild(report);
}

function defineSuites(suites) {
	clearUI();

	suites.forEach(function(suite){
		suite.tests.forEach(function(test){
			var dfd = {};
			dfd.promise = new Promise(function(resolve){
				dfd.resolve = resolve;
			});
			var key = suite.title + " - " + test.title;
			testMap.set(key, dfd);
		});

		describe(suite.title, function(){
			suite.tests.forEach(function(test){
				it(test.title, function(done) {
					var key = suite.title + " - " + test.title;
					testMap.get(key).resolve(done);
				});
			})
		})
	});

	mocha.run();
}

function setTestResults(msg) {
	var key = msg.suite + " - " + msg.title;
	var dfd = testMap.get(key);

	if(dfd) {
		dfd.promise.then(function(done){
			assert.equal(msg.state, "passed");

			if(typeof done === "undefined") {
				debugger;
			}

			done();
		});
	}

}
