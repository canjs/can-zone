var wait = require("can-wait");
var xhr = require("can-wait/xhr");
var isNode = require("detect-node");

var h = require("virtual-dom/h");
var diff = require("virtual-dom/diff");
var patch = require("virtual-dom/patch");
var createElement = require("virtual-dom/create-element");
var virtualize = require("vdom-virtualize");

function home(){
	return h("div", { id: "home" }, [
		h("div", "Hello world"),
		h("a", { href: "/todos", title: "Todo Page" }, "Todos")
	]);
}

function todos(state){
	if(state.todos) {
		return h("div", state.todos.map(function(todo){
			return h("li", todo.todo);
		}));
	}

	return h("div", "Loading...");
}

exports.state = function(page, update){
	page = page || location.pathname.split("/").pop() || "home";

	var state = {
		page: page
	};

	if(page === "todos") {
		var xhr = new XMLHttpRequest();
		xhr.onload = function(){
			console.log("loaded");
			var todos = JSON.parse(xhr.responseText);
		};
	}

	return state;
};

var render = exports.render = function(state){
	return h("div#app", state.page === "home" ? home() : todos(state));
};

if(!isNode) {
	var state;
	var rootNode = document.getElementById("app")
	var tree = virtualize(rootNode);

	function update(newState){
		var newTree = render(Object.assign(state, newState));
		var patches = diff(tree, newTree);
		rootNode =	patch(rootNode, patches);
		tree = newTree;
	}

	wait(function(){
		state = {
			page: location.pathname.split("/").pop() || "home"
		};
		return render(state, update);
	}, xhr)
		.then(function(data){
			var newTree = data.result;
			var patches = diff(tree, newTree);
			rootNode = patch(rootNode, patches);
			tree = newTree;
		}, function(err){
			setTimeout(function() { throw err; }, 5);
		});

	document.body.addEventListener("click", function(ev){
		if(ev.target.tagName === "A") {
			ev.preventDefault();
			var a = ev.target;
			history.pushState({}, a.title, a.href);

			update({ page: a.href.split("/").pop() });
		}
	});
}
