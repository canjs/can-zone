/*[process-shim]*/
(function(global, env) {
	// jshint ignore:line
	if (typeof process === "undefined") {
		global.process = {
			argv: [],
			cwd: function() {
				return "";
			},
			browser: true,
			env: {
				NODE_ENV: env || "development"
			},
			version: "",
			platform:
				global.navigator &&
				global.navigator.userAgent &&
				/Windows/.test(global.navigator.userAgent)
					? "win"
					: ""
		};
	}
})(
	typeof self == "object" && self.Object == Object
		? self
		: typeof process === "object" &&
		  Object.prototype.toString.call(process) === "[object process]"
			? global
			: window,
	"development"
);

/*[global-shim-start]*/
(function(exports, global, doEval) {
	// jshint ignore:line
	var origDefine = global.define;

	var get = function(name) {
		var parts = name.split("."),
			cur = global,
			i;
		for (i = 0; i < parts.length; i++) {
			if (!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val) {
		var parts = name.split("."),
			cur = global,
			i,
			part,
			next;
		for (i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if (!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod) {
		if (!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, default: true };
		for (var p in mod) {
			if (!esProps[p]) return false;
		}
		return true;
	};

	var hasCjsDependencies = function(deps) {
		return (
			deps[0] === "require" && deps[1] === "exports" && deps[2] === "module"
		);
	};

	var modules =
		(global.define && global.define.modules) ||
		(global._define && global._define.modules) ||
		{};
	var ourDefine = (global.define = function(moduleName, deps, callback) {
		var module;
		if (typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for (i = 0; i < deps.length; i++) {
			args.push(
				exports[deps[i]]
					? get(exports[deps[i]])
					: modules[deps[i]] || get(deps[i])
			);
		}
		// CJS has no dependencies but 3 callback arguments
		if (hasCjsDependencies(deps) || (!deps.length && callback.length)) {
			module = { exports: {} };
			args[0] = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args[1] = module.exports;
			args[2] = module;
		}
		// Babel uses the exports and module object.
		else if (!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if (deps[1] === "module") {
				args[1] = module;
			}
		} else if (!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if (globalExport && !get(globalExport)) {
			if (useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	});
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function() {
		// shim for @@global-helpers
		var noop = function() {};
		return {
			get: function() {
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load) {
				doEval(__load.source, global);
			}
		};
	});
})(
	{},
	typeof self == "object" && self.Object == Object
		? self
		: typeof process === "object" &&
		  Object.prototype.toString.call(process) === "[object process]"
			? global
			: window,
	function(__$source__, __$global__) {
		// jshint ignore:line
		eval("(function() { " + __$source__ + " \n }).call(__$global__);");
	}
);

/*can-zone@1.0.1#lib/env*/
define('can-zone/lib/env', function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
        var nodeRequire = typeof System !== 'undefined' && System._nodeRequire ? System._nodeRequire : typeof require === 'function' ? require : function () {
        };
        var isNW = isNode && function () {
            try {
                var requireAlias = 'require';
                if (typeof System !== 'undefined' && System._nodeRequire) {
                    return System._nodeRequire('nw.gui') !== 'undefined';
                } else if (typeof global === 'object' && global[requireAlias]) {
                    return global[requireAlias]('nw.gui') !== 'undefined';
                } else {
                    return false;
                }
            } catch (e) {
                return false;
            }
        }();
        var isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        var g = isWorker ? self : isNW ? window : isNode ? global : window;
        exports.isNode = isNode;
        exports.isNW = isNW;
        exports.isWorker = isWorker;
        exports.global = g;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-zone@1.0.1#lib/util*/
define('can-zone/lib/util', function (require, exports, module) {
    'use strict';
    exports.forEach = Array.prototype.forEach || function (fn) {
        for (var i = 0, len = this.length; i < len; i++) {
            fn.call(this, this[i], i);
        }
    };
    var supportsSymbol = typeof Symbol === 'function';
    exports.symbol = function (str) {
        return supportsSymbol ? Symbol(str) : str;
    };
    exports.defineProperty = function (obj, prop, defn) {
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop, defn);
        } else {
            obj[prop] = defn.value;
        }
    };
});
/*can-zone@1.0.1#lib/zones/globals*/
define('can-zone/lib/zones/globals', [
    'require',
    'exports',
    'module',
    'can-zone/lib/util',
    'can-zone/lib/env',
    'can-zone'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var util = require('can-zone/lib/util');
        var env = require('can-zone/lib/env');
        var g = env.global;
        var Zone = require('can-zone');
        if (env.isNode) {
            var globalTimeoutId = 1;
        }
        module.exports = function () {
            var globals, overrides = [];
            return {
                name: 'globals',
                plugins: [promiseZone],
                created: function () {
                    var zone = this;
                    globals = this.globals || {};
                    function findObj(name, obj) {
                        var parts = name.split('.');
                        var property = parts.pop();
                        util.forEach.call(parts, function (prop) {
                            var n = obj[prop];
                            if (!n) {
                                n = obj[prop] = {};
                            }
                            obj = n;
                        });
                        return {
                            obj: obj,
                            prop: property
                        };
                    }
                    function addGlobal(name, value) {
                        var info = findObj(name, g);
                        overrides.push(new Override(info.obj, info.prop, function () {
                            return value;
                        }));
                    }
                    for (var name in globals) {
                        addGlobal(name, globals[name]);
                    }
                },
                beforeTask: function (task) {
                    if (task.nestedTask)
                        return;
                    util.forEach.call(overrides, function (o) {
                        o.trap();
                    });
                },
                afterTask: function (task) {
                    if (task.nestedTask)
                        return;
                    util.forEach.call(overrides, function (o) {
                        o.release();
                    });
                }
            };
        };
        function Override(obj, name, fn) {
            this.oldValue = obj[name];
            this.obj = obj;
            this.name = name;
            this.value = fn(this.oldValue, this);
        }
        Override.prototype.trap = function () {
            this.obj[this.name] = this.value;
        };
        Override.prototype.release = function () {
            this.obj[this.name] = this.oldValue;
        };
        function promiseZone() {
            var promiseThen = function () {
                    if (!Zone.current || oldPromiseThen.zoneWrapped) {
                        return oldPromiseThen.apply(this, arguments);
                    }
                    return Zone.tasks.then(oldPromiseThen).apply(this, arguments);
                }, oldPromiseThen;
            return {
                beforeTask: function (task) {
                    if (task.nestedTask)
                        return;
                    oldPromiseThen = Promise.prototype.then;
                    Promise.prototype.then = promiseThen;
                },
                afterTask: function (task) {
                    if (task.nestedTask)
                        return;
                    Promise.prototype.then = oldPromiseThen;
                }
            };
        }
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-zone@1.0.1#register*/
define('can-zone/register', function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        'format cjs';
        (function () {
            var isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
            var isWorker = typeof WorkerGlobalScope !== 'undefined' && typeof self !== 'undefined' && self instanceof WorkerGlobalScope;
            var g = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : isNode ? global : window;
            if (typeof module !== 'undefined' && !!module.exports) {
                module.exports = wrapAll;
            }
            var forEach = Array.prototype.forEach || function (cb) {
                var i = 0, len = this.length;
                for (; i < len; i++) {
                    cb.call(this, this[i], i);
                }
            };
            var props = Array.prototype.concat.call([
                'setTimeout',
                'clearTimeout',
                'requestAnimationFrame',
                'cancelAnimationFrame',
                'Promise.prototype.then',
                'XMLHttpRequest.prototype.send',
                'Node.prototype.addEventListener',
                'Node.prototype.removeEventListener',
                'process.nextTick',
                'fetch',
                'setImmediate',
                'clearImmediate',
                {
                    prop: 'MutationObserver',
                    fn: function (MutationObserver) {
                        return function (fn) {
                            return new MutationObserver(fn);
                        };
                    }
                }
            ], getGlobalEventHandlersNames().map(function (name) {
                return 'HTMLElement.prototype.' + name;
            }));
            wrapAll(g);
            if (g.Promise) {
                monitor(g, 'Promise', 'Promise.prototype.then', g);
            }
            function extract(obj, prop) {
                var parts = prop.split('.');
                while (parts.length > 1) {
                    prop = parts.shift();
                    obj = obj[prop];
                    if (!obj)
                        break;
                    if (parts.length === 1)
                        prop = parts[0];
                }
                return [
                    obj,
                    prop
                ];
            }
            function wrapAll(globalObj) {
                var global = globalObj || g;
                var wrapped = global.__canZoneWrapped;
                if (!wrapped) {
                    wrapped = global.__canZoneWrapped = {};
                }
                forEach.call(props, function (prop) {
                    var fn;
                    if (typeof prop === 'object') {
                        fn = prop.fn;
                        prop = prop.prop;
                    }
                    var key = prop;
                    if (wrapped[key]) {
                        return;
                    }
                    var results = extract(global, prop);
                    var obj = results[0];
                    prop = results[1];
                    if (!isGlobalEventHandler(prop) && (!obj || !obj[prop])) {
                        return;
                    } else {
                        wrapped[key] = true;
                    }
                    wrapInZone(obj, prop, fn, global);
                });
            }
            function wrapInZone(object, property, fn, global) {
                var wrappedFn = function () {
                    var Zone = global.CanZone;
                    if (typeof Zone !== 'undefined' && !!Zone.current) {
                        return Zone.tasks[property](fn, Zone).apply(this, arguments);
                    }
                    return fn.apply(this, arguments);
                };
                var descriptor = Object.getOwnPropertyDescriptor(object, property) || {};
                if (isGlobalEventHandler(property)) {
                    fn = descriptor.set;
                    descriptor.set = wrappedFn;
                } else {
                    fn = fn ? fn(object[property]) : object[property];
                    descriptor.value = wrappedFn;
                    descriptor.writable = true;
                }
                Object.defineProperty(object, property, descriptor);
                wrappedFn.zoneWrapped = true;
            }
            function isGlobalEventHandler(property) {
                return property.substr(0, 2) === 'on';
            }
            function getGlobalEventHandlersNames() {
                var names = [];
                if (!isNode && !isWorker) {
                    names = Object.getOwnPropertyNames(HTMLElement.prototype).filter(isGlobalEventHandler);
                }
                return names;
            }
            function monitor(object, property, thingToRewrap, global) {
                var current = object[property];
                Object.defineProperty(object, property, {
                    get: function () {
                        return current;
                    },
                    set: function (val) {
                        var hasChanged = !val.zoneWrapped && val !== current;
                        current = val;
                        if (hasChanged) {
                            var results = extract(object, thingToRewrap);
                            var localObject = results[0];
                            var localProperty = results[1];
                            wrapInZone(localObject, localProperty, null, global);
                            monitor(object, property, thingToRewrap, global);
                        }
                    }
                });
            }
        }());
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-zone@1.0.1#lib/tasks*/
define('can-zone/lib/tasks', [
    'require',
    'exports',
    'module',
    'can-zone/lib/env',
    'can-zone/lib/util'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var env = require('can-zone/lib/env');
        var util = require('can-zone/lib/util');
        var slice = Array.prototype.slice;
        var isWorker = typeof WorkerGlobalScope !== 'undefined' && typeof self !== 'undefined' && self instanceof WorkerGlobalScope;
        if (env.isNode) {
            var globalTimeoutId = 1;
        }
        var addTimer = function (callback, Zone) {
            var timeoutId = callback();
            var id = timeoutId;
            if (env.isNode && typeof id !== 'number') {
                id = timeoutId.__timeoutId = globalTimeoutId++;
            }
            var zone = Zone.current;
            if (!zone.isResolved) {
                zone.ids[id] = timeoutId;
            }
            return {
                timeoutId: timeoutId,
                id: id
            };
        };
        var removeTimer = function (timeoutId, callback, Zone) {
            if (timeoutId == null) {
                return callback();
            }
            var zone = Zone.current;
            var ids = zone.ids;
            var id = env.isNode && typeof timeoutId !== 'number' ? timeoutId.__timeoutId : timeoutId;
            if (!zone.isResolved && ids[id]) {
                delete ids[id];
                zone.removeWait();
            }
            return callback();
        };
        var getGlobalEventHandlersNames = function getGlobalEventHandlersNames() {
            var names = [];
            if (!env.isNode && !isWorker) {
                names = Object.getOwnPropertyNames(HTMLElement.prototype).filter(function isGlobalEventHandler(name) {
                    return name.substr(0, 2) === 'on';
                });
            }
            return names;
        };
        var defineSetTask = function defineSetTask(set, Zone) {
            return function setTask(newValue) {
                if (newValue) {
                    var outHandler = newValue[EVENT_HANDLER];
                    if (outHandler === undefined) {
                        outHandler = Zone.current.wrap(newValue);
                        newValue[EVENT_HANDLER] = outHandler;
                    }
                    set.call(this, outHandler);
                } else {
                    set.call(this, newValue);
                }
            };
        };
        getGlobalEventHandlersNames().forEach(function (name) {
            exports[name] = defineSetTask;
        });
        exports.setTimeout = function (setTimeout, Zone) {
            return function (fn, timeout) {
                var args = Array.prototype.slice.call(arguments);
                var zone = Zone.current;
                var idInfo;
                args[0] = zone.waitFor(function () {
                    delete zone.ids[idInfo.id];
                    return fn.apply(this, arguments);
                });
                var self = this;
                idInfo = addTimer(function () {
                    return setTimeout.apply(self, args);
                }, Zone);
                return idInfo.timeoutId;
            };
        };
        exports.clearTimeout = function (clearTimeout, Zone) {
            return function (timeoutId) {
                var args = arguments, self = this;
                return removeTimer(timeoutId, function () {
                    return clearTimeout.apply(self, args);
                }, Zone);
            };
        };
        exports.setImmediate = function (setImmediate, Zone) {
            return function (fn) {
                var idInfo;
                var zone = Zone.current;
                var callback = zone.waitFor(function () {
                    delete zone.ids[idInfo.id];
                    return fn.apply(this, arguments);
                });
                var self = this, args = slice.call(arguments, 1);
                idInfo = addTimer(function () {
                    return setImmediate.apply(self, [callback].concat(args));
                }, Zone);
                return idInfo.timeoutId;
            };
        };
        exports.clearImmediate = function (clearImmediate, Zone) {
            return function (immediateId) {
                var args = arguments, self = this;
                return removeTimer(immediateId, function () {
                    return clearImmediate.apply(self, args);
                }, Zone);
            };
        };
        exports.requestAnimationFrame = function (rAF, Zone) {
            return function (fn) {
                var zone = Zone.current;
                var callback = zone.waitFor(fn);
                var id = rAF.call(this, callback);
                zone.rafs[id] = true;
                return id;
            };
        };
        exports.cancelAnimationFrame = function (cAF, Zone) {
            return function (id) {
                var zone = Zone.current;
                var ids = zone.rafs;
                var res = cAF.call(this, id);
                if (!zone.isResolved && ids[id]) {
                    delete ids[id];
                    zone.removeWait();
                }
                return res;
            };
        };
        exports.then = function (then, Zone) {
            return function (onFulfilled, onRejected) {
                var fn;
                var rejected;
                var callback = Zone.current.waitFor(function (val) {
                    if (fn) {
                        return fn.apply(this, arguments);
                    } else if (rejected) {
                        return Promise.reject(val);
                    }
                    return val;
                }, false);
                var callWith = function (cb, isError) {
                    return function () {
                        fn = cb;
                        rejected = !!isError;
                        return callback.apply(this, arguments);
                    };
                };
                return then.call(this, callWith(onFulfilled), callWith(onRejected, true));
            };
        };
        var supportsOnload = undefined;
        exports.send = function (send, Zone) {
            if (typeof supportsOnload === 'undefined') {
                supportsOnload = 'onload' in new XMLHttpRequest();
            }
            return function () {
                var onreadystatechange = this.onreadystatechange, onload = this.onload, onloadend = this.onloadend, onerror = this.onerror, thisXhr = this, zone = Zone.current;
                zone.addWait();
                if (supportsOnload && this.onload) {
                    this.onload = createCallback(onload);
                    this.onloadend = createCallback(onloadend);
                    this.onerror = createCallback(onerror);
                } else {
                    onreadystatechange = onreadystatechange || function () {
                    };
                    var callback = createCallback(onreadystatechange);
                    var ourReadystatechange = function (ev) {
                        var xhr = ev ? ev.target : thisXhr;
                        if (xhr.readyState === 4) {
                            return callback.apply(this, arguments);
                        } else {
                            if (xhr.onload) {
                                xhr.onload(ev);
                            }
                            if (xhr.onloadend) {
                                xhr.onloadend(ev);
                            }
                            return onreadystatechange.apply(this, arguments);
                        }
                    };
                    this.onreadystatechange = ourReadystatechange;
                    Object.defineProperty(this, 'onreadystatechange', {
                        enumerable: true,
                        configurable: true,
                        get: function () {
                            return ourReadystatechange;
                        },
                        set: function (newFn) {
                            onreadystatechange = newFn;
                            callback = createCallback(onreadystatechange);
                        }
                    });
                }
                function createCallback(fn) {
                    fn = fn || function () {
                    };
                    return function () {
                        var task = new Zone.Task(zone, fn);
                        var res = task.run(this, arguments);
                        zone.removeWait();
                        return res;
                    };
                }
                return send.apply(this, arguments);
            };
        };
        exports.nextTick = function (nextTick, Zone) {
            return function (fn) {
                var callback = Zone.current.waitFor(fn);
                var args = slice.call(arguments, 1);
                args.unshift(callback);
                return nextTick.apply(process, args);
            };
        };
        exports.fetch = function (fetch, Zone) {
            return function () {
                var zone = Zone.current;
                zone.addWait();
                var promise = fetch.apply(null, arguments);
                promise.then(function (response) {
                    zone.removeWait();
                    return response;
                }, function (err) {
                    zone.removeWait();
                    throw err;
                });
                return promise;
            };
        };
        exports.MutationObserver = function (MutationObserver, Zone) {
            return function (fn) {
                fn = Zone.current.wrap(fn);
                return new MutationObserver(fn);
            };
        };
        var EVENT_HANDLER = util.symbol('zone-eventhandler');
        exports.addEventListener = function (addEventListener, Zone) {
            return function (eventName, handler, useCapture) {
                var outHandler = handler[EVENT_HANDLER];
                if (outHandler === undefined) {
                    outHandler = Zone.current.wrap(handler);
                    handler[EVENT_HANDLER] = outHandler;
                }
                return addEventListener.call(this, eventName, outHandler, useCapture);
            };
        };
        exports.removeEventListener = function (removeEventListener, Zone) {
            return function (eventName, handler, useCapture) {
                var outHandler = handler && handler[EVENT_HANDLER] || handler;
                return removeEventListener.call(this, eventName, outHandler, useCapture);
            };
        };
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-zone@1.0.1#lib/zone*/
define('can-zone', [
    'require',
    'exports',
    'module',
    'can-zone/lib/env',
    'can-zone/lib/zones/globals',
    'can-zone/lib/util',
    'can-zone/register',
    'can-zone/lib/tasks'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var g = require('can-zone/lib/env').global;
        var Promise = g.Promise;
        var globalsZone = require('can-zone/lib/zones/globals');
        var forEach = require('can-zone/lib/util').forEach;
        var registerZone = require('can-zone/register');
        var slice = Array.prototype.slice;
        var noop = function () {
        };
        function Deferred() {
            var dfd = this;
            this.promise = new Promise(function (resolve, reject) {
                dfd.resolve = resolve;
                dfd.reject = reject;
            });
        }
        function Task(zone, fn, catchErrors) {
            this.zone = zone;
            this.fn = fn;
            this.catchErrors = catchErrors;
            this.nestedTask = zone.runningTask;
        }
        Task.prototype.run = function (ctx, args) {
            var Zone = this.zone.constructor;
            var previousZone = Zone.current;
            var zone = Zone.current = this.zone;
            if (!this.nestedTask)
                zone.execHook('beforeTask', this);
            var res;
            try {
                zone.runningTask = true;
                res = this.fn.apply(ctx, args);
                Zone.current = previousZone;
                if (!this.nestedTask)
                    zone.execHookR('afterTask', this);
            } catch (err) {
                Zone.current = previousZone;
                if (!this.nestedTask) {
                    zone.execHookR('afterTask', this);
                }
                if (this.catchErrors !== false && !this.zone.isResolved) {
                    zone.errors.push(err);
                } else {
                    throw err;
                }
            } finally {
                zone.runningTask = this.nestedTask;
            }
            return res;
        };
        var hooks = [
            'beforeTask',
            'afterTask',
            'created',
            'ended',
            'beforeRun',
            'afterRun'
        ];
        var commonGlobals = [
            'document',
            'window',
            'location'
        ];
        function buildZoneSpec(zone, spec, plugins, processedSpecs) {
            spec = spec || {};
            processedSpecs = processedSpecs || [];
            if (processedSpecs.indexOf(spec) !== -1) {
                return;
            } else {
                processedSpecs.push(spec);
            }
            plugins = plugins || [];
            if (typeof spec === 'function') {
                spec = spec(zone.data);
            } else if (Array.isArray(spec)) {
                spec = { plugins: spec };
            }
            if (spec.plugins) {
                plugins = plugins.concat(spec.plugins);
            }
            forEach.call(plugins, function (plugin) {
                buildZoneSpec(zone, plugin, null, processedSpecs);
            });
            if (spec.hooks) {
                zone.hooks = zone.hooks.concat(spec.hooks);
            }
            forEach.call(zone.hooks, function (hook) {
                var propName = hook + 's';
                var array = zone[propName];
                if (!array) {
                    array = zone[propName] = [];
                }
                if (spec[hook]) {
                    array.push(spec[hook]);
                }
            });
            var globals = extend({}, spec.globals || {});
            forEach.call(commonGlobals, function (name) {
                if (spec[name])
                    globals[name] = spec[name];
            });
            for (var p in globals) {
                zone.globals[p] = globals[p];
            }
        }
        function Zone(spec) {
            spec = spec || {};
            this.deferred = new Deferred();
            this.waits = 0;
            this.ids = Object.create(null);
            this.rafs = Object.create(null);
            this.errors = [];
            this.data = {};
            this.globals = {};
            this.parent = this.constructor.current;
            this.hooks = slice.call(hooks);
            buildZoneSpec(this, spec, [globalsZone]);
            this.execHook('created');
        }
        Zone.waitFor = function (fn, catchErrors) {
            var fun = fn || noop;
            var zone = this.current;
            if (!zone)
                return fun;
            return zone.waitFor(fun, catchErrors);
        };
        Zone.error = function (error) {
            var zone = this.current;
            if (!zone)
                return error;
            zone.errors.push(error);
            return error;
        };
        Zone.ignore = function (fn) {
            var Zone = this;
            return function () {
                var zone = Zone.current;
                if (!zone)
                    return fn.apply(this, arguments);
                var task = new Task(zone);
                Zone.current = undefined;
                zone.execHookR('afterTask', task);
                var res = fn.apply(this, arguments);
                zone.execHook('beforeTask', task);
                Zone.current = zone;
                return res;
            };
        };
        Zone.prototype.runTask = function (fn, ctx, args, catchErrors, decrementWaits) {
            var res, error;
            var task = new Task(this, fn, catchErrors);
            try {
                res = task.run(ctx, args);
            } catch (err) {
                error = err;
            }
            if (decrementWaits && this.removeWait)
                this.removeWait();
            if (error)
                throw error;
            return res;
        };
        Zone.prototype.run = function (fn) {
            if (this.isResolved) {
                this.deferred = new Deferred();
                this.isResolved = false;
            } else {
                this.execHook('beforeRun');
            }
            var task = new Task(this, fn);
            this.data.result = task.run();
            if (!this.isResolved) {
                this.execHook('afterRun');
            }
            if (!this.waits || this.errors.length) {
                this.end();
            }
            return this.deferred.promise;
        };
        Zone.prototype.fork = function (zoneSpec) {
            var Zone = this.constructor;
            var plugins = [];
            if (zoneSpec)
                plugins.push(zoneSpec);
            plugins.unshift(this);
            var newZone = new Zone({ plugins: plugins });
            return newZone;
        };
        Zone.prototype.execHook = function (hook) {
            var args = slice.call(arguments, 1);
            var zone = this;
            var prop = hook + 's';
            var array = this[prop];
            if (array) {
                forEach.call(array, function (fn) {
                    fn.apply(zone, args);
                });
            }
        };
        Zone.prototype.execHookR = function (hook) {
            var args = slice.call(arguments, 1);
            var zone = this;
            var prop = hook + 's';
            var array = this[prop];
            if (array) {
                var i = array.length - 1;
                for (; i >= 0; i--) {
                    array[i].apply(zone, args);
                }
            }
        };
        Zone.prototype.wrap = function (fn, catchErrors) {
            var zone = this;
            return function () {
                return zone.runTask(fn, this, arguments, catchErrors);
            };
        };
        Zone.prototype.end = function () {
            if (!this.isResolved) {
                this.execHook('ended');
            }
            var dfd = this.deferred;
            if (this.errors.length) {
                var error = this.errors[0];
                Object.defineProperty(error, 'errors', { value: this.errors });
                dfd.reject(error);
            } else {
                dfd.resolve(this.data);
            }
            this.isResolved = true;
        };
        Zone.prototype.waitFor = function (fn, catchErrors) {
            this.addWait();
            var zone = this;
            return function () {
                return zone.runTask(fn, this, arguments, catchErrors, true);
            };
        };
        Zone.prototype.addWait = function () {
            this.waits++;
            if (this.parent) {
                this.parent.addWait();
            }
        };
        Zone.prototype.removeWait = function () {
            this.waits--;
            if (this.waits === 0) {
                this.end();
            }
            if (this.parent) {
                this.parent.removeWait();
            }
        };
        Zone.Task = Task;
        Zone.register = registerZone;
        function extend(a, b) {
            if (!b)
                return a;
            for (var p in b) {
                a[p] = b[p];
            }
            return a;
        }
        Zone.tasks = {};
        addTasks(require('can-zone/lib/tasks'));
        function addTasks(tasks) {
            for (var p in tasks) {
                Zone.tasks[p] = tasks[p];
            }
        }
        g.CanZone = g.CanZone || Zone;
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = Zone;
        }
    }(function () {
        return this;
    }(), require, exports, module));
});
/*[global-shim-end]*/
(function(global) { // jshint ignore:line
	global._define = global.define;
	global.define = global.define.orig;
}
)(typeof self == "object" && self.Object == Object ? self : (typeof process === "object" && Object.prototype.toString.call(process) === "[object process]") ? global : window);