var stealTools = require("steal-tools");

stealTools.export({
	system: {
		config: __dirname + "/../package.json!npm"
	},
	options: {},
	outputs: {
		"+global-js": {}
	}
});
