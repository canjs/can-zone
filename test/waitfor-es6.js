import wait from "../can-wait";
import waitFor, { waitData } from "../waitfor";
import assert from "assert";
import test from './waitfor_test';

describe("can-wait/waitfor es6", function(){
	test(wait, assert, waitFor, waitData);
});
