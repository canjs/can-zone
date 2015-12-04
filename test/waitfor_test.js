module.exports = tests;

function tests(wait, assert, waitFor, waitData) {

	describe("waitFor", function(){
		it("Does wait on stuff", function(done){
			wait(function(){
				Promise.resolve().then(waitFor(function(){
					assert(true, "we did wait for this");
				}));
			}).then(done, done);
		});
	});

	describe("waitData", function(){
		it("Adds data to a request", function(done){
			wait(function(){
				setTimeout(function(){
					waitData("hello world");
				}, 40);
			}).then(function(responses){
				assert.equal(responses.length, 1, "One piece of data added");
				assert.equal(responses[0], "hello world", "data added to the request");
			}).then(done, done);
		});
	});

}
