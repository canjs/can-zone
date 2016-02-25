/**
 * @module {Function} can-wait/ignore ignore
 * @parent can-wait
 *
 * Allows Ignoring a function, so that any calls out to tasks are ignored and
 * not part of the normal task flow.
 *
 * @signature `ignore(fn)`
 * @param {Function} fn A function whose calls should be ignored.
 * @return {Function} A function that will call `fn`, ignoring all calls to
 * tasks.
 */
var ignore = function(fn){
	return function(){
		if(!canWaitPresent()) {
			return fn.apply(this, arguments);
		}
		var zone = CanZone.current;
		var Task = CanZone.Task;

		// Use the original versions

		// TODO
		// This won't work any more because Tasks don't do release/trap any more.

		var task = new Task(zone);
		task.release();
		var res = fn.apply(this, arguments);
		task.trap();
		return res;
	};

};

function canWaitPresent(){
	return typeof CanZone !== "undefined" && !!CanZone.current;
}

module.exports = ignore;
