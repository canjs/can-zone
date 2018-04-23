var steal = require("@steal");

steal.config({
	map: {
		"steal-mocha": "node_modules/mocha/mocha"
	},
	meta: {
		"node_modules/mocha/mocha": {
		   "format": "global",
		   "exports": "mocha"
		}
	}
});

steal.import("~/test/worker_test");
