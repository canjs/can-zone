exports.setTimeout = setTimeout;

if(typeof MutationObserver === "function") {
	exports.MutationObserver = MutationObserver;
}
