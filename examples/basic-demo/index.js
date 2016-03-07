var canWait = require("can-zone");

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

			requestAnimationFrame(function(){
				results.push("3-d");
			});
		}, 100);

		setTimeout(function(){
			results.push("3-b");
		}, 32);

		requestAnimationFrame(function(){
			results.push("3-c");
		});
	},

	function(results){
		Promise.resolve().then(function(){
			results.push("4-a");

			setTimeout(function(){
				results.push("4-b");

				var p = new Promise(function(resolve){
					results.push("4-c");

					Promise.resolve().then(function(){
						results.push("4-d");

						resolve();
					});
				});

				var pp = p.then(function(){
					results.push("4-e");

					return new Promise(function(resolve, reject){
						reject(new Error("Sorry"));
					});
				});

				pp.then(null, function(){
					results.push("4-f");
				});
			});
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
	"4": { bg: "#011627", font: "#FDFFFC" }
};

function drawRow(results) {
	var body = $("tbody");
	var tr = cEl("tr");

	results.forEach(function(thing){
		var td = cEl("td");
		var requestNumber = thing.split("-")[0];
		var color = requestColors[requestNumber];
		td.style.background = color.bg ? color.bg : color;
		td.style.color = color.font ? color.font : td.style.color;
		td.textContent = thing;
		tr.appendChild(td);
	});

	body.appendChild(tr);
}
