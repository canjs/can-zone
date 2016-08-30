var assert = require("assert");
var g = require("../lib/env").global;
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

describe("Late-bound overriding of Promise", function(){
	it("works", function(done){
		var P = g.Promise = function(){
			this._stuff = {foo: function(){}};
		};

		P.prototype.then = function(){
			var p = new P();

			var stuff = this._stuff;
			stuff.foo();

			return p;
		};

		new Zone().run(function(){
			debugger;
			var p = new Promise(function(resolve){
				resolve();
			});
			p.then(function(){
				Zone.current.data.worked = true;
			});
		}).then(function(data){
			assert.ok(data.worked);
			done();
		});
	});
});
