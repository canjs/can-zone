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
		var request = canWait.currentRequest;

		// Use the original versions
		request.release();
		var res = fn.apply(this, arguments);
		request.trap();
		return res;
	};

};

function canWaitPresent(){
	return typeof canWait !== "undefined" && !!canWait.currentRequest;
}

module.exports = ignore;
