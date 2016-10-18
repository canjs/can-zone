var assert = require("assert");
var isNode = require("../lib/env").isNode;

// For the test, this must be required before Zone
var locals = require("./register/locals");

var Zone = require("../lib/zone");

if(!isNode) {
	require("steal-mocha");
}
var isBrowser = !isNode;

describe("Modules using local references to globals", function(){
	describe("setTimeout", function(){
		var setTimeout = locals.setTimeout;

		it("Works", function(done){
			new Zone().run(function(){
				setTimeout(function(){
					Zone.current.data.worked = true;
				});
			}).then(function(data){
				assert(data.worked, "it worked");
				done();
			}, done);
		});
	});

	if(isBrowser) {
		describe("MutationObserver", function(){
			var MutationObserver = locals.MutationObserver;

			it("Clearing timeouts works within a MutationObserver callback",
			   function(done){
				new Zone().run(function(){
					var zone = Zone.current;

					var timeoutId = setTimeout(function(){
						zone.data.worked = false;
					}, 10);

					var mo = new MutationObserver(function(){
						clearTimeout(timeoutId);
						zone.data.worked = Zone.current === zone;
					});
					var el = document.createElement("div");
					mo.observe(el, { childList: true });
					el.textContent = "foobar";

				}).then(function(data){
					assert(data.worked, "Timeout was cleared in the zone");
					done();
				});
			});
		});
	}
});

describe('System.import', function(){
	if(typeof System === "object" && !!System.import) {
		it("Rejects an import for a file that doesn't exist", function(done){
			new Zone().run(function(){
				var p = System.import("fake/module");

				p.then(function(mod){
					Zone.error(new Error("import worked when it should not have"));
				}, function(err){
					Zone.current.data.worked = true;
				});

			}).then(function(data){
				assert.ok(data.worked, "it rejected like it should have");
				done();
			}, done);
		});
	}
})