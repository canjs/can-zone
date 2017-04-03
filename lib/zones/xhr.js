var env = require("../env");
var util = require("../util");

module.exports = env.isNode ? nodeZone : browserZone;

var WAIT_URL = util.symbol("__canWaitURL");

function browserZone(data){
	var cache, oldOpen, oldSend;

	var matches = function(request, url, body) {
		return (request.url === url) &&
			(!body || request.data === body);
	};

	var open = function(method, url){
		util.defineProperty(this, WAIT_URL, {
			value: url,
			enumerable: false
		});
		return oldOpen.apply(this, arguments);
	};

	var send = function(body){
		var data, response;
		var url = this[WAIT_URL];
		for(var i = 0, len = cache.length; i < len; i++) {
			data = cache[i];
			if(matches(data.request, url, body)) {
				response = setResponse(this, data.response);
				cache.splice(i, 1);
				break;
			}
		}
		if(response) {
			var onload = this.onload || function(){};
			var xhr = this;
			setTimeout(function(){
				onload.call(xhr, { target: xhr });
			}, 0);
			return;
		}
		return oldSend.apply(this, arguments);
	};

	return {
		beforeTask: function(){
			cache = env.global.XHR_CACHE;
			if(cache) {
				oldOpen = XMLHttpRequest.prototype.open;
				oldSend = XMLHttpRequest.prototype.send;
				XMLHttpRequest.prototype.open = open;
				XMLHttpRequest.prototype.send = send;
			}
		},

		afterTask: function(){
			if(cache) {
				XMLHttpRequest.prototype.open = oldOpen;
				XMLHttpRequest.prototype.send = oldSend;
			}
		}
	};
}

function nodeZone(data){
	var oldOpen, oldSend;

	var open = function(method, url){
		util.defineProperty(this, WAIT_URL, {
			value: url,
			enumerable: false
		});

		return oldOpen.apply(this, arguments);
	};

	var send = function(body){
		var onload = this.onload,
			thisXhr = this;

		this.onload = function(ev){
			var xhr = ev ? ev.target : thisXhr;

			// Save the xhr to data
			if(!data.xhr) {
				data.xhr = new XHR();
			}
			data.xhr.data.push({
				request: {
					url: xhr[WAIT_URL],
					data: body
				},
				response: {
					status: xhr.status,
					responseText: xhr.responseText,
					headers: xhr.getAllResponseHeaders()
				}
			});

			if(onload) {
				return onload.apply(this, arguments);
			}
		};

		return oldSend.apply(this, arguments);
	};

	var supportsXHR = function(){
		return typeof XMLHttpRequest !== "undefined";
	};

	return {
		beforeTask: function(){
			oldSend = XMLHttpRequest.prototype.send;
			oldOpen = XMLHttpRequest.prototype.open;
			XMLHttpRequest.prototype.send = send;
			XMLHttpRequest.prototype.open = open;
		},
		afterTask: function(){
			XMLHttpRequest.prototype.send = oldSend;
			XMLHttpRequest.prototype.open = oldOpen;
		}
	};
}

function setResponse(xhr, response){
	util.defineProperty(xhr, "responseText", {
		value: response.responseText
	});
	util.defineProperty(xhr, "status", {
		value: response.status
	});
	xhr.getAllResponseHeaders = function(){
		return response.headers;
	};
	return xhr;
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

function XHR(){
	this.data = [];
}

XHR.prototype.toString = function(){
	var json = JSON.stringify(this.data);
	json = json.replace(escapeRegExp, function(m){
		return escapeTable[m];
	});
	return "XHR_CACHE = " + json + ";";
};
