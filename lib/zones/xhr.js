var env = require("../env");
var util = require("../util");

module.exports = env.isNode ? nodeZone : browserZone;

var WAIT_URL = util.symbol("__canWaitURL");
var REAL_XHR = util.symbol("__xhr");

function browserZone(data){
	var cache, oldXHR;
	//var cache, oldOpen, oldSend;

	var propsToIgnore = { onreadystatechange: true, onload: true, __events: true };
	// Copy props from source to dest, except those on the XHR prototype and
	// listed as excluding.
	var assign = function(dest, source, excluding){
		excluding = excluding || {};

		// copy everything on this to the xhr object that is not on `this`'s prototype
		for(var prop in source){
			if(!( prop in XHR.prototype) && !excluding[prop] ) {
				dest[prop] = source[prop];
			}
		}
	};

	var callParent = function(proto, props) {
		var i = 0, len = props.length;
		var addMethod = function(method){
			proto[method] = function(){
				var xhr = this[REAL_XHR];
				return xhr[method].apply(xhr, arguments);
			};
		};
		for(; i < len; i++) {
			addMethod(props[i]);
		}
	};

	var XHR = function(){
		var xhr = this[REAL_XHR] = new oldXHR();

		this.onload = null;
		this.onerror = null;

		assign(this, xhr, propsToIgnore);
	};

	callParent(XHR.prototype, [
		"setRequestHeader",
		"getAllResponseHeaders",
		"addEventListener",
		"removeEventListener",
		"getResponseHeader"
	]);

	XHR.prototype.open = function(method, url){
		util.defineProperty(this, WAIT_URL, {
			value: url,
			enumerable: false
		});
		return this[REAL_XHR].open.apply(this._xhr, arguments);
	};

	XHR.prototype.send = function(){
		var realXhr = this[REAL_XHR];
		var fakeXhr = this;
		assign(realXhr, this, propsToIgnore);

		var data, response;
		var url = this[WAIT_URL];

		for(var i = 0, len = cache.length; i < len; i++) {
			data = cache[i];
			if(data.request.url === url) {
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

		var onreadystatechange = fakeXhr.onreadystatechange;
		realXhr.onreadystatechange = function(){
			assign(fakeXhr, realXhr, propsToIgnore);
			if(onreadystatechange) {
				return onreadystatechange.apply(fakeXhr, arguments);
			}
		};
		var onload = fakeXhr.onload;
		if(onload) {
			realXhr.onload = function(){
				return onload.apply(fakeXhr, arguments);
			};
		}
		var onerror = fakeXhr.onerror;
		if(onerror) {
			realXhr.onerror = function(){
				return onerror.apply(fakeXhr, arguments);
			};
		}
		return realXhr.send.apply(realXhr, arguments);
	};

	return {
		beforeTask: function(){
			cache = env.global.XHR_CACHE;
			if(cache && cache.length) {
			   oldXHR = XMLHttpRequest;
			   env.global.XMLHttpRequest = XHR;
			}
		},

		afterTask: function(){
			cache = env.global.XHR_CACHE;
			if(cache && cache.length) {
				env.global.XMLHttpRequest = oldXHR;
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

	var send = function(){
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
					url: xhr[WAIT_URL]
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

function XHR(){
	this.data = [];
}

XHR.prototype.toString = function(){
	return "XHR_CACHE = " + JSON.stringify(this.data) + ";";
};
