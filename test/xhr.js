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
		describe("With XHR Cache", function(){
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

		describe("Without XHR Cache", function(){
			beforeEach(function(){
				this.oldXHR = XMLHttpRequest;
				var XHR = g.XMLHttpRequest = function(){};
				XHR.prototype.open = function(){};
				XHR.prototype.send = function(){
					var onreadystatechange = this.onreadystatechange;
					var onload = this.onload;
					var xhr = this;
					xhr.readyState = 4;
					setTimeout(function(){
						xhr.status = 200;
						xhr.responseText = '{"foo":"bar"}';
						var ev = { target: xhr };
						onreadystatechange.call(xhr, ev);
						onload.call(xhr, ev);
					}, 5);
				};
				g.XHR_CACHE = [{request:{url:""}}];
			});

			afterEach(function(){
				XMLHttpRequest.prototype.open = this.oldOpen;
				delete g.XHR_CACHE;
			});

			it("Calls the real xhr.send", function(done){
				var app = function(){
					var xhr = new XMLHttpRequest();
					xhr.open("GET", "foo://bar");
					xhr.onload = function(){
						var resp = JSON.parse(xhr.responseText);
						Zone.current.data.worked = resp.foo === "bar";
					};
					xhr.send();
				};

				new Zone(xhrZone).run(app).then(function(data){
					assert.ok(data.worked, "it loaded without the cache");
				}).then(done, done);
			});
		});

		describe("XHR methods", function(){
			beforeEach(function(){
				g.XHR_CACHE = [{request:{url:""}}];
				this.oldXHR = g.XMLHttpRequest;
				var XHR = g.XMLHttpRequest = function(){};
				XHR.prototype.open = function(){};
				XHR.prototype.setRequestHeader = function(){
					Zone.current.data.worked = true;
				};
				XHR.prototype.getAllResponseHeaders = function(){
					return "foo";
				};
				XHR.prototype.addEventListener =
				XHR.prototype.removeEventListener = function(){};
				XHR.prototype.getResponseHeader = function(){
					return "bar";
				};
			});

			afterEach(function(){
				delete g.XHR_CACHE;
				g.XMLHttpRequest = this.oldXHR;
			});

			it("Supports setRequestHeader", function(done){
				var zone = new Zone(xhrZone);
				zone.run(function(){
					var xhr = new XMLHttpRequest();
					xhr.setRequestHeader("foo", "bar");
				}).then(function(data){
					assert.ok(data.worked, "Called the real setRequestHeader");
					done();
				}, done);
			});

			it("Supports getAllResponseHeaders", function(done){
				var zone = new Zone(xhrZone);
				zone.run(function(){
					var xhr = new XMLHttpRequest();
					var headers = xhr.getAllResponseHeaders();
					assert.equal(headers, "foo");
				}).then(function(){
					done();
				}, done);
			});

			it("Supports addEventListener", function(done){
				var zone = new Zone(xhrZone);
				zone.run(function(){
					var xhr = new XMLHttpRequest();
					xhr.addEventListener("load", function(){});
				}).then(function(){
					done();
				}, done);
			});

			it("Supports removeEventListener", function(done){
				var zone = new Zone(xhrZone);
				zone.run(function(){
					var xhr = new XMLHttpRequest();
					xhr.removeEventListener("load", function(){});
				}).then(function(){
					done();
				}, done);
			});

			it("Supports getResponseHeader", function(done){
				var zone = new Zone(xhrZone);
				zone.run(function(){
					var xhr = new XMLHttpRequest();
					var d = xhr.getResponseHeader("foo");
					assert.equal(d, "bar");
				}).then(function(){
					done();
				}, done);

			});
		});

		describe("Errors", function(){
			beforeEach(function(){
				this.oldOpen = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(){};
				g.XHR_CACHE = [
					{ request: { url: "foo://bar" },
						response: { responseText: '{"foo": "bar"}',
							status: 404,
							headers: "application/json" } }
				];
			});

			afterEach(function(){
				XMLHttpRequest.prototype.open = this.oldOpen;
				delete g.XHR_CACHE;
			});


			it("Sets the status to 404", function(done){
				new Zone(xhrZone).run(function(){
					var xhr = new XMLHttpRequest();
					xhr.open("GET", "foo://bar");
					xhr.onload = function(){
						assert.equal(xhr.status, 404, "Set to 404");
					};
					xhr.send();
				}).then(function(){
					done();
				}, done);
			});
		});
	});
}
