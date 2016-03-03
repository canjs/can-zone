//var render = require("./index");
var wait = require("can-wait");

var url = require("url");
var express = require("express");
var app = express();
var vdomApp = require("./index");
var h = require("virtual-dom/h");
var toHTML = require("vdom-to-html");

app.use(express.static(__dirname));
app.use(express.static(__dirname + "/../../"));

function index(req, res){
	var page = url.parse(req.url).pathname.substr(1) || "home";

	wait(function(){
		var state = vdomApp.state(page, function(newState){
			Object.assign(state, newState);
		});

		return state;
	}, require("can-wait/xhr"))
	.then(function(data){
		var state = data.result;

		console.log('got state', data);
		var json = data.responses ? data.responses.toString() : "[]";
		var cache = "INLINE_CACHE = " + json + ";";

		var html = h("html", [
			h("head", [ h("title", "virtual-dom App") ]),
			h("body", [
				vdomApp.render(state),
				h("script", cache),
				h("script", { src: "node_modules/steal/steal.js" })
			])
		]);

		var str = toHTML(html);
		res.send(str);
	});
}

app.get("/", index);
app.get("/todos", index);

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
