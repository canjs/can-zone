var results = [];

var requests = [
	function(results){
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
	},

	function(results){
		setTimeout(function(){
			results.push("2-a");

			setTimeout(function(){
				results.push("2-d");
			}, 100);

		}, 4);

		setTimeout(function(){
			results.push("2-b");
		}, 77);

		setTimeout(function(){
			results.push("2-c");
		});

	},

	function(results) {
		setTimeout(function(){
			results.push("3-a");
		}, 100);

		setTimeout(function(){
			results.push("3-b");
		}, 32);

		requestAnimationFrame(function(){
			results.push("3-c");
		});
	}

];

requests.forEach(function(fn){
	var results = [];
	fn = fn.bind(null, results);
	canWait(fn).then(function(){
		drawRow(results);
	});
});

var $ = document.querySelector.bind(document);
var cEl = document.createElement.bind(document);

// https://coolors.co/app/011627-fdfffc-2ec4b6-e71d36-ff9f1c
var requestColors = {
	"1": "#2EC4B6",
	"2": "#E71D36",
	"3": "#FF9F1C",
	"4": "#011627"
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
