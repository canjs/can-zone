var stealTools = require("steal-tools");

stealTools.export({
	steal: {
		config: __dirname + "/../package.json!npm"
	},
	options: {},
	outputs: {
		"+global-js": {}
	}
});
