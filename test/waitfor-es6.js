import wait from "../can-wait";
import waitFor, { waitData, waitFor as otherWaitFor, waitError } from "../waitfor";
import assert from "assert";
import test from './waitfor_test';

describe("can-wait/waitfor es6", function(){
	describe("ES6 API", function(){
		it("All of the things are right", function(){
			assert.equal(waitFor, otherWaitFor, "These are just aliases");
			assert.equal(waitData, waitFor.data, "waitData as waitFor.data");
			assert.equal(waitData, waitFor.waitData, "waitData as waitFor.waitData");
		});
	});

	test(wait, assert, waitFor, waitData, waitError);
});
