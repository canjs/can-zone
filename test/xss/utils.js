var env = require("../../lib/env");
var g = env.global;
var fs = require("fs");

exports.mockXHR = mockXHR;

function mockXHR(mockedResponse) {
	var globalSetTimeout = g.setTimeout;
	var OldXHR = g.XMLHttpRequest;
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
			xhr.responseText = mockedResponse;
			onload && onload({ target: xhr });
		}, 10);
	};

	return function(){
		g.XMLHttpRequest = OldXHR;
	};
}

exports.injectTest = injectTest;

function injectTest(cache, testJs) {
	var testPth = __dirname + "/inj.html"
	var testPage = fs.readFileSync(testPth, "utf8");
	var xhrScript = "<script>" + cache + "</script>";
	testPage = testPage.replace("MAIN", testJs);
	testPage = testPage + xhrScript;
	fs.writeFileSync(__dirname + "/out.html", testPage, "utf8");
}
