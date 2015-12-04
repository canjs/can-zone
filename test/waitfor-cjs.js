var wait = require("../can-wait");
var waitFor = require("../waitfor");
var waitData = waitFor.waitData;
var assert = require("assert");
var test = require("./waitfor_test");

describe("can-wait/waitfor CommonJS", function(){
	test(wait, assert, waitFor, waitData);
});
