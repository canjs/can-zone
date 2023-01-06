var assert = require("assert");
var env = require("../lib/env");
var g = env.global;
var Zone = require("../lib/zone");
var fetchZone = require("../fetch");
var oldFetch = g.fetch || require("node-fetch-commonjs");

if(env.isNode) {
	describe("Fetch Zone in Node", function(){
		beforeEach(function(){
			var globalSetTimeout = g.setTimeout;
			var Response = g.Response || oldFetch.Response
			var fetch = g.fetch = function(){
				return Promise.resolve(
					new Response('{"foo":"bar"}')
				);
			};
		});

		afterEach(function(){
			g.fetch = oldFetch;
		});

		it("Can be called multiple times", function(done){
			var zone = new Zone({
				plugins: [fetchZone]
			});

			var firstRun = zone.run(function(){
				fetch("http://example.com");
			}).then(function(data){
				assert(data.fetch.toString().length, "got the fetch object");
			});

			firstRun.then(function(){
				zone = new Zone({
					plugins: [fetchZone]
				});

				return zone.run(function(){
					fetch("http://example.com");
				}).then(function(data){
					assert(data.fetch.toString().length, "got the fetch object");
				});
			}).then(done, done);
		});

		describe("POST", function(){
			it("Multiple requests to the same URL results in multiple entries", function(done){
				var zone = new Zone({
					plugins: [fetchZone]
				}).run(function(){
					function api(data) {
						var f = fetch("http://example.com", {
							method: "post",
							body: JSON.stringify(data)
						});
						return new Promise(function(resolve){
							f.then(resolve);
						});
					}


					api({one:1}).then(function(){
						return api({two:2});
					});

				}).then(function(data){
					var cache = data.fetch.toString();
					assert.ok(/{\\"one\\"/.test(cache), "got the first post");
					assert.ok(/{\\"two\\"/.test(cache), "got the second post");
				}).then(done, done);
			});
		});
	});
} else {
	describe("Fetch Zone in the Browser", function(){
		describe("Basics", function(){
			beforeEach(function(){
				g.FETCH_CACHE = [
					{ request: { url: "foo://bar" },
						response: { responseText: '{"foo": "bar"}',
							headers: "application/json" } },
					{ request: { url: "baz://qux" },
						response: { responseText: '{"baz": "qux"}',
							headers: "application/json" } }
				];
			});

			afterEach(function(){
				delete g.FETCH_CACHE;
			});

			it("Loads data from the cache", function(done){
				function app(){
					assert.equal(g.FETCH_CACHE.length, 2,
								 "There are 2 items in the cache");

					fetch("foo://bar").then(
						function(firstResponse){
							return firstResponse.json();
						}).then(function(firstResponseBody) {
							Zone.current.data.first = firstResponseBody;
							assert.equal(g.FETCH_CACHE.length, 1,
										 "There is one item in the cache");
						});

					setTimeout(function(){
						fetch("baz://qux").then(function(secondResponse) {
							return secondResponse.json();
						}).then(function(secondResponseBody){
							Zone.current.data.second = secondResponseBody;
							assert.equal(g.FETCH_CACHE.length, 0,
										 "The cache is empty");
						});
					}, 30);
				}

				new Zone(fetchZone).run(app).then(function(data){
					assert.equal(data.first.foo, "bar", "got the first response");
					assert.equal(data.second.baz, "qux", "got the second response");
				}).then(done, done);
			});
		});

		describe("URLs relative to server (i.e. done-ssr proxy-request)", function(){
			beforeEach(function(){
				g.FETCH_CACHE = [
					{ request: { url: "foo://bar/abc" },
						response: { responseText: '{"foo": "bar"}',
							headers: "application/json" } },
					{ request: { url: "foo://bar/abc/def" },
						response: { responseText: '{"baz": "qux"}',
							headers: "application/json" } }
				];
			});

			afterEach(function(){
				delete g.FETCH_CACHE;
			});

			it("Loads data from the cache", function(done){
				function app(){
					assert.equal(g.FETCH_CACHE.length, 2,
								 "There are 2 items in the cache");

					fetch("/abc").then(function(firstResponse) {
						return firstResponse.json();
					}).then(function(firstResponseBody){
						Zone.current.data.first = firstResponseBody;
						assert.equal(g.FETCH_CACHE.length, 1,
									 "There is one item in the cache");
					});

					setTimeout(function(){
						fetch("/abc/def").then(function(secondResponse) {
							return secondResponse.json();
						}).then(function(secondResponseBody){
							Zone.current.data.second = secondResponseBody;
							assert.equal(g.FETCH_CACHE.length, 0,
										 "The cache is empty");
						});
					}, 30);
				}

				new Zone(fetchZone).run(app).then(function(data){
					assert.equal(data.first.foo, "bar", "got the first response");
					assert.equal(data.second.baz, "qux", "got the second response");
				}).then(done, done);
			});
		});

		describe("POST with multiple requests from the same URL", function(){
			beforeEach(function(){
				g.FETCH_CACHE = [
					{ request: { url: "foo://bar", data:"{\"one\":1}" },
						response: { responseText: '{"foo": "bar"}',
							headers: "application/json" } },
					{ request: { url: "foo://bar", data:"{\"two\":2}" },
						response: { responseText: '{"baz": "qux"}',
							headers: "application/json" } }
				];
			});

			afterEach(function(){
				delete g.FETCH_CACHE;
			});

			it("Loads each from the cache", function(done){
				function app(){
					assert.equal(g.FETCH_CACHE.length, 2,
								 "There are 2 items in the cache");

					fetch("foo://bar", {
						method: "post",
						body: JSON.stringify({two:2})
					}).then(function(firstResponse) {
						return firstResponse.json();
					}).then(function(firstResponseBody){
						Zone.current.data.first = firstResponseBody;
						assert.equal(g.FETCH_CACHE.length, 1,
									 "There is one item in the cache");
					});

					setTimeout(function(){
						fetch("foo://bar", {
							method: "post",
							body: JSON.stringify({one:1})
						}).then(function(secondResponse) {
							return secondResponse.json();
						}).then(function(secondResponseBody){
							Zone.current.data.second = secondResponseBody;
							assert.equal(g.FETCH_CACHE.length, 0,
										 "The cache is empty");
						});
					}, 30);
				}

				new Zone(fetchZone).run(app).then(function(data){
					assert.equal(data.first.baz, "qux", "got the first response");
					assert.equal(data.second.foo, "bar", "got the second response");
				}).then(done, done);
			});
		});

		describe("Errors", function(){
			beforeEach(function(){
				g.FETCH_CACHE = [
					{ request: { url: "foo://bar" },
						response: { responseText: '{"foo": "bar"}',
							status: 404,
							headers: "application/json" } }
				];
			});

			afterEach(function(){
				delete g.FETCH_CACHE;
			});


			it("Sets the status to 404", function(done){
				new Zone(fetchZone).run(function(){
					fetch("foo://bar").then(function(response) {
						assert.equal(resonse.status, 404, "Set to 404");
					});
				}).then(function(){
					done();
				}, done);
			});
		});
	});
}
