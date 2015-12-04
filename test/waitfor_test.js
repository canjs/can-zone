module.exports = tests;

function tests(wait, assert, waitFor, waitData, waitError) {

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

	describe("waitError", function(){
		it("adds errors to the error stack", function(done){
			wait(function(){
				setTimeout(function(){
					var error = new Error("oh no");
					var ret = waitError(error);
					assert.equal(error, ret, "waitError returns the error");
				}, 20);
			}).then(null, function(errors){
				assert.equal(errors.length, 1, "There is one error in the stack");
				assert.equal(errors[0].message, "oh no", "Correct error");
			}).then(done, done);
		});
	});

}
