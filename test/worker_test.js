var mocha = require("steal-mocha");

mocha.setup({
  ui: 'bdd',
  reporter: null,
});

require("./test");

var runResults = mocha.run();

var suiteInfo = runResults.suite.suites.map(function(suite){
	return {
		title: suite.title,
		tests: suite.tests.map(function(test){
			return {
				title: test.title
			}
		})
	};
});

postMessage({
	type: "suites",
	suites: suiteInfo
});

runResults.on("test end", function(test) {
	postMessage({
		type: "test",
		title: test.title,
		state: test.state,
		suite: test.parent.title
	});
});

runResults.on("end", function() {
	postMessage({
		type: "run end"
	});
  //console.log(`${runResults.failures} out of ${runResults.total} failures.`);
});
