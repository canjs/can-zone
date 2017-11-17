
module.exports = function(fn, args) {
	/*
	 * Hi there! Stepping into the below function will take you to the code
	 * that is preventing the Zone to finish. You might see some can-zone code
	 * first, if so just keep stepping in. Best of luck!
	**/

	debugger;
	return fn.apply(this, args);
};
