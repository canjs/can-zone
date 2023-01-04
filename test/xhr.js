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

		describe("POST", function(){
			it("Multiple requests to the same URL results in multiple entries", function(done){
				var zone = new Zone({
					plugins: [xhrZone]
				}).run(function(){
					function api(data) {
						var xhr = new XMLHttpRequest();
						xhr.open("POST", "http://example.com");
						return new Promise(function(resolve){
							xhr.onload = resolve;
							xhr.send(JSON.stringify(data));
						});
					}


					api({one:1}).then(function(){
						return api({two:2});
					});

				}).then(function(data){
					var cache = data.xhr.toString();
					assert.ok(/{\\"one\\"/.test(cache), "got the first post");
					assert.ok(/{\\"two\\"/.test(cache), "got the second post");
				}).then(done, done);
			});
		});
	});
} else {
	describe("XHR Zone in the Browser", function(){
		describe("Basics", function(){
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

			it("Loads data from the cache when using onreadystatechange", function(done) {
				function app() {
					Promise.resolve().then(function(){
						return new Promise(function(resolve, reject){
							var xhr = new XMLHttpRequest();
							xhr.open("GET", "foo://bar");
							xhr.onreadystatechange = function(){
								if(xhr.readyState === 4) {
									resolve();
								}
							};
							xhr.send();
						});
					})
					.then(function(){
						Zone.current.data.worked = true;
					});
				}

				new Zone(xhrZone).run(app).then(function(data){
					assert.equal(data.worked, true);
				})
				.then(done, done);
			});

			it("Loads data from the cache when using onloadend", function(done) {
				function app() {
					Promise.resolve().then(function(){
						return new Promise(function(resolve, reject){
							var xhr = new XMLHttpRequest();
							xhr.open("GET", "foo://bar");
							xhr.onloadend = function(){
								resolve();
							};
							xhr.send();
						});
					})
					.then(function(){
						Zone.current.data.worked = true;
					});
				}

				new Zone(xhrZone).run(app).then(function(data){
					assert.equal(data.worked, true);
				})
				.then(done, done);
			});
		});

		describe("URLs relative to server (i.e. done-ssr proxy-request)", function(){
			beforeEach(function(){
				this.oldOpen = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(){};
				g.XHR_CACHE = [
					{ request: { url: "foo://bar/abc" },
						response: { responseText: '{"foo": "bar"}',
							headers: "application/json" } },
					{ request: { url: "foo://bar/abc/def" },
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
					// url that has one slash
					first.open("GET", "/abc");
					first.onload = function(){
						Zone.current.data.first = JSON.parse(first.responseText);
						assert.equal(g.XHR_CACHE.length, 1,
									 "There is one item in the cache");
					};
					first.send();

					setTimeout(function(){
						var second = new XMLHttpRequest();
					// url that has two slashes
					second.open("GET", "/abc/def");
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

		describe("POST with multiple requests from the same URL", function(){
			beforeEach(function(){
				this.oldOpen = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(){};
				g.XHR_CACHE = [
					{ request: { url: "foo://bar", data:"{\"one\":1}" },
						response: { responseText: '{"foo": "bar"}',
							headers: "application/json" } },
					{ request: { url: "foo://bar", data:"{\"two\":2}" },
						response: { responseText: '{"baz": "qux"}',
							headers: "application/json" } }
				];
			});

			afterEach(function(){
				XMLHttpRequest.prototype.open = this.oldOpen;
				delete g.XHR_CACHE;
			});

			it("Loads each from the cache", function(done){
				function app(){
					assert.equal(g.XHR_CACHE.length, 2,
								 "There are 2 items in the cache");

					var first = new XMLHttpRequest();
					first.open("POST", "foo://bar");
					first.onload = function(){
						Zone.current.data.first = JSON.parse(first.responseText);
						assert.equal(g.XHR_CACHE.length, 1,
									 "There is one item in the cache");
					};
					first.send(JSON.stringify({two:2}));

					setTimeout(function(){
						var second = new XMLHttpRequest();
						second.open("POST", "foo://bar");
						second.onload = function(){
							var xhr = second;
							Zone.current.data.second = JSON.parse(xhr.responseText);
							assert.equal(g.XHR_CACHE.length, 0,
										 "The cache is empty");
						};
						second.send(JSON.stringify({one:1}));
					}, 30);
				}

				new Zone(xhrZone).run(app).then(function(data){
					assert.equal(data.first.baz, "qux", "got the first response");
					assert.equal(data.second.foo, "bar", "got the second response");
				}).then(done, done);
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
