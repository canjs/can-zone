var assert = require("assert");
var env = require("../lib/env");
var g = env.global;
var Zone = require("../lib/zone");
var xhrZone = require("../xhr");

if(env.isNode) {
	describe("XHR Zone in Node", function(){
		beforeEach(function(){
			var globalSetTimeout = g.setTimeout;
			this.OldXHR = g.XMLHttpRequest;
			var XHR = g.XMLHttpRequest = function(){
				this.onload = null;
			};

			XHR.prototype.getAllResponseHeaders = function(){
				return "Content-Type: application/json";
			};

			XHR.prototype.open = function(){};

			XHR.prototype.send = function(){
				var onload = this.onload;
				var xhr = this;

				globalSetTimeout(function(){
					xhr.responseText = '{"foo":"bar"}';
					onload && onload({ target: xhr });
				}, 10);
			};
		});

		afterEach(function(){
			g.XMLHttpRequest = this.OldXHR;
		});

		it("Can be called multiple times", function(done){
			var zone = new Zone({
				plugins: [xhrZone]
			});

			var firstRun = zone.run(function(){
				var xhr = new XMLHttpRequest();
				xhr.open("GET", "http://example.com");
				xhr.send();
			}).then(function(data){
				assert(data.xhr.toString().length, "got the xhr object");
			});

			firstRun.then(function(){
				zone = new Zone({
					plugins: [xhrZone]
				});

				return zone.run(function(){
					var xhr = new XMLHttpRequest();
					xhr.open("GET", "http://example.com");
					xhr.send();
				}).then(function(data){
					assert(data.xhr.toString().length, "got the xhr object");
				});
			}).then(done, done);
		});

	});
} else {
	describe("XHR Zone in the Browser", function(){
		beforeEach(function(){
			this.oldOpen = XMLHttpRequest.prototype.open;
			XMLHttpRequest.prototype.open = function(){};
			g.XHR_CACHE = [
				{ request: { url: "foo://bar" },
					response: { responseText: '{"foo": "bar"}',
						headers: "application/json" } },
				{ request: { url: "baz://qux" },
					response: { responseText: '{"baz": "qux"}',
						headers: "application/json" } }
			];
		});

		afterEach(function(){
			XMLHttpRequest.prototype.open = this.oldOpen;
			delete g.XHR_CACHE;
		});

		it("Loads data from the cache", function(done){
			function app(){
				assert.equal(g.XHR_CACHE.length, 2,
							 "There are 2 items in the cache");

				var first = new XMLHttpRequest();
				first.open("GET", "foo://bar");
				first.onload = function(){
					Zone.current.data.first = JSON.parse(first.responseText);
					assert.equal(g.XHR_CACHE.length, 1,
								 "There is one item in the cache");
				};
				first.send();

				setTimeout(function(){
					var second = new XMLHttpRequest();
					second.open("GET", "baz://qux");
					second.onload = function(){
						var xhr = second;
						Zone.current.data.second = JSON.parse(xhr.responseText);
						assert.equal(g.XHR_CACHE.length, 0,
									 "The cache is empty");
					};
					second.send();
				}, 30);
			}

			new Zone(xhrZone).run(app).then(function(data){
				assert.equal(data.first.foo, "bar", "got the first response");
				assert.equal(data.second.baz, "qux", "got the second response");
			}).then(done, done);
		});
	});
}
