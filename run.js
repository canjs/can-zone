var results = [];

var promise = waitUntilEmpty(function(){

	setTimeout(function(){
		results.push("1-a");
	}, 29);

	setTimeout(function(){
		results.push("1-b");
	}, 13);

	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://chat.donejs.com/api/messages");
	xhr.onload = function(){
		results.push("1-c");
	};
	xhr.send();
});

promise.then(function(){
	drawRow(results);
});

var $ = document.querySelector.bind(document);
var cEl = document.createElement.bind(document);

var requestColors = {
	"1": "blue"
};

function drawRow(results) {
	var body = $("tbody");
	var tr = cEl("tr");

	results.forEach(function(thing){
		var td = cEl("td");
		var requestNumber = thing.split("-")[0];
		var color = requestColors[requestNumber];
		td.style.background = color;
		td.textContent = thing;
		tr.appendChild(td);
	});

	body.appendChild(tr);
}
