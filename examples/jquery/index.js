var $ = require("jquery");
var Zone = require("can-wait").Zone;
var xhr = require("can-wait/xhr");
var isNode = require("detect-node");

$.fn.home = function(){
	this.html("<div>Hello world</div><a href='/todos' title='Todo Page'>Todos</a>");
	return this;
};

$.fn.todos = function(){
	this.html("Loading...");
	$.get("http://localhost:8080/api/todos").then(function(todos){
		this.html("");
		todos.forEach(function(todo){
			this.append("<li>" + todo.todo + "</li>");
		}.bind(this));
	}.bind(this));
	return this;
};

var render = module.exports = function(){
	var page = location.pathname.split("/").pop() || "home";
	if(page === "home") {
		return $("<div id='home'>").home();
	} else {
		return $("<ul id='todos'>").todos();
	}
};

if(!isNode) {
	new Zone(xhr).run(render)
		.then(function(data){
			$(document.body).html(data.result);
		}, function(err){
			setTimeout(function() { throw err; }, 5);
		});

	$(document.body).on("click", function(ev){
		ev.preventDefault();
		var a = ev.target;
		history.pushState({}, a.title, a.href);

		$(document.body).html(render());
	});
}
