"use strict";
var env = require("../env");
var util = require("../util");

module.exports = env.isNode ? nodeZone : browserZone;

function browserZone(data){
	var cache, oldFetch;
	var noop = Function.prototype;

	var matches = function(request, url, body) {
		var requestURL = request.url;
		// check if url is relative to server (i.e. /bar) instead of absolute url (i.e. http://foo/bar) so that done-ssr proxy-request will match on client-side
		if (url.substr(0, 1) === '/') {
			// strip everything before pathname to match url relative to server
			requestURL = requestURL.replace(/^\w*:\/{2}[^\/]+\//i, '/');
		}
		return (requestURL === url) &&
			(!body || request.data === body);
	};

	function stubFetch(url, options) {
		var response, stubResponse;
		options = options || {};

		for(var i = 0, len = cache.length; i < len; i++) {
			data = cache[i];
			if(matches(data.request, url, options.body)) {
				response = data.response;
				cache.splice(i, 1);
				break;
			}
		}

		if(response) {
			stubResponse = new Response(
				response.responseText,
				{
					status: 200,
					statusText: "OK"
				}
			)

			util.defineProperty(response, "url", {
				value: url
			});

			return Promise.resolve(stubResponse);
		} else {
			return oldFetch(url, options);
		}
	}


	return {
		beforeTask: function(){
			cache = env.global.FETCH_CACHE;
			if(cache) {
				oldFetch = fetch;
				global.fetch = stubFetch;
			}
		},

		afterTask: function(){
			if(oldFetch) {
				fetch = oldFetch;
				oldFetch = null;
			}
		}
	};
}

function nodeZone(data){
	var oldFetch;

	function stubFetch(url, options) {
		return oldFetch(url, options).then(function(response) {
			var cloneResponse = response.clone();

			var headers = {};
			cloneResponse.headers.forEach(function(header) {
				var key = header.key;
				var value = header.value;
				headers[key] = value;
			})

			cloneResponse.text().then(function(respBody) {
				if(!data.fetch) {
					data.fetch = new Fetch();
				}
				data.fetch.data.push({
					request: {
						url: url,
						data: options.body
					},
					response: {
						status: cloneResponse.status,
						responseText: respBody,
						headers: headers
					}
				});
			});

			return response;
		});
	}

	return {
		beforeTask: function(){
			oldFetch = fetch;
			global.fetch = stubFetch;
		},
		afterTask: function(){
			if(oldFetch) {
				global.fetch = oldFetch;
				oldFetch = null;
			}
		}
	};
}

var escapeTable = {
	"<": "\\u003c",
	">": "\\u003e",
	"&": "\\u0026",
	"=": "\\u003d"
};

var escapeRegExp = new RegExp(
	"(" +
	Object.keys(escapeTable).join("|") +
	")", "g");

function Fetch(){
	this.data = [];
}

Fetch.prototype.toString = function(){
	var json = JSON.stringify(this.data);
	json = json.replace(escapeRegExp, function(m){
		return escapeTable[m];
	});
	return "FETCH_CACHE = " + json + ";";
};