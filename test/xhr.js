var assert = require("assert");
var env = require("../lib/env");
var g = env.global;
var Zone = require("../lib/zone").Zone;
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
}
