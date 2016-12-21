var assert = require("assert");
require("steal-mocha");

describe("An injected script", function(){
	it("doesn't run", function(){
		assert.equal(window.FOO, undefined, "script not injected");
	});

	it("Has the correct value", function(){
		var resp = XHR_CACHE[0].response.responseText;
		var expected = '</script><script>window.FOO=\'bar\';</script>';
		assert.equal(resp, expected);
	});
});
