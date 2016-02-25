var jsdom = require("jsdom").jsdom;

function makeLoc(){
	return {
		href: '',
		protocol: '',
		host: '',
		hostname: '',
		port: '',
		pathname: '',
		search: '',
		hash: ''
	};
}

function makeDoc(){
	return jsdom("<html><head><title>jQuery app</title></head>" +
					"<body><script src='node_modules/steal/steal.js'>" +
					"</script></body></html>");
}
var doc = global.document = makeDoc();
global.window = doc.defaultView;
global.XMLHttpRequest = window.XMLHttpRequest;
global.location = makeLoc();

var render = require("./index");
var $ = require("jquery");
var Zone = require("can-wait").Zone;

var url = require("url");
var express = require("express");
var app = express();

app.use(express.static(__dirname));
app.use(express.static(__dirname + "/../../"));

function route(req, res){
	var location = makeLoc();
	location.pathname = url.parse(req.url).pathname;

	var doc = makeDoc();

	var zone = new Zone({
		globals: {
			document: doc,
			window: doc.defaultView,
			location: location
		},
		plugins: [require("can-wait/xhr")]
	});

	zone.run(render).then(function(data){
		if(data.xhr) {
			var xhrStr = data.xhr.toString();
			var script = $("<script>" + xhrStr + "</script>");
			$(doc.body).prepend(script);
		}
		$(doc.body).prepend(data.result);
		res.send(doc.documentElement.outerHTML);
	});
}

app.get("/", route);
app.get("/todos", route);

app.get("/api/todos", function(req, res){
	setTimeout(function(){
		res.json([
			{ id: 1, todo: "Get some food" },
			{ id: 2, todo: "Walk the dog" }
		]);
	}, 5);
});

app.listen(8080);
console.error("Listening on port", 8080);
