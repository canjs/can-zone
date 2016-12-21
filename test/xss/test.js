var Zone = require("../../lib/zone");
var xhrZone = require("../../xhr");
var testee = require("testee");

var utils = require("./utils");
var mockXHR = utils.mockXHR;
var injectTest = utils.injectTest;

describe("Script injection", function(){
	this.timeout(50000);

	beforeEach(function(){
		var resp = '</script><script>window.FOO=\'bar\';</script>';
		this.resetXHR = mockXHR(resp);
	});

	afterEach(function(){
		this.resetXHR();
	});

	it("Correctly escapes scripts", function(done){
		var zone = new Zone({
			plugins: [xhrZone]
		});

		zone.run(function(){
			var xhr = new XMLHttpRequest();
			xhr.open("GET", "http://example.com");
			xhr.send();
		}).then(function(data){
			injectTest(data.xhr, "test/xss/browser-test");

			return testee.test(["test/xss/out.html"], 'firefox', {
				reporter: 'Spec'
			});
		}).then(function() { done(); }, done);
	});
});
