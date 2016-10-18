/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		modules[moduleName] = module && module.exports ? module.exports : result;
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*lib/env*/
define('can-zone/lib/env', function (require, exports, module) {
    var isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
    var nodeRequire = typeof System !== 'undefined' && System._nodeRequire ? System._nodeRequire : typeof require === 'function' ? require : function () {
    };
    var isNW = isNode && function () {
        try {
            return nodeRequire('nw.gui') !== 'undefined';
        } catch (e) {
            return false;
        }
    }();
    var g = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : isNW ? window : isNode ? global : window;
    exports.isNode = isNode;
    exports.isNW = isNW;
    exports.global = g;
});
/*lib/util*/
define('can-zone/lib/util', function (require, exports, module) {
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
/*lib/zones/globals*/
define('can-zone/lib/zones/globals', function (require, exports, module) {
    var util = require('can-zone/lib/util');
    var env = require('can-zone/lib/env');
    var g = env.global;
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
});
/*register*/
define('can-zone/register', function (require, exports, module) {
    'format cjs';
    (function () {
        var isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
        var g = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : isNode ? global : window;
        if (typeof module !== 'undefined' && !!module.exports) {
            module.exports = wrapAll;
        }
        var wrapped = g.__canZoneWrapped;
        if (!wrapped) {
            wrapped = g.__canZoneWrapped = {};
        }
        var forEach = Array.prototype.forEach || function (cb) {
            var i = 0, len = this.length;
            for (; i < len; i++) {
                cb.call(this, this[i], i);
            }
        };
        var props = [
            'setTimeout',
            'clearTimeout',
            'requestAnimationFrame',
            'Promise.prototype.then',
            'XMLHttpRequest.prototype.send',
            'process.nextTick',
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
        ];
        wrapAll();
        if (g.Promise) {
            monitor(g, 'Promise', 'Promise.prototype.then');
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
        function wrapAll() {
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
                var results = extract(g, prop);
                var obj = results[0];
                prop = results[1];
                if (!obj || !obj[prop]) {
                    return;
                } else {
                    wrapped[key] = true;
                }
                wrapInZone(obj, prop, fn);
            });
        }
        function wrapInZone(object, property, fn) {
            if (fn) {
                fn = fn(object[property]);
            } else {
                fn = object[property];
            }
            var wrappedFn = function () {
                if (typeof Zone !== 'undefined' && !!Zone.current) {
                    return Zone.tasks[property](fn).apply(this, arguments);
                }
                return fn.apply(this, arguments);
            };
            wrappedFn.zoneWrapped = true;
            object[property] = wrappedFn;
        }
        function monitor(object, property, thingToRewrap) {
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
                        wrapInZone(localObject, localProperty);
                        monitor(object, property, thingToRewrap);
                    }
                }
            });
        }
    }());
});
/*lib/tasks*/
define('can-zone/lib/tasks', function (require, exports, module) {
    var env = require('can-zone/lib/env');
    var slice = Array.prototype.slice;
    if (env.isNode) {
        var globalTimeoutId = 1;
    }
    var addTimer = function (callback) {
        var timeoutId = callback();
        var id = timeoutId;
        if (env.isNode) {
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
    var removeTimer = function (timeoutId, callback) {
        if (timeoutId == null) {
            return callback();
        }
        var zone = Zone.current;
        var ids = zone.ids;
        var id = env.isNode ? timeoutId.__timeoutId : timeoutId;
        if (!zone.isResolved && ids[id]) {
            delete ids[id];
            zone.removeWait();
        }
        return callback();
    };
    exports.setTimeout = function (setTimeout) {
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
            });
            return idInfo.timeoutId;
        };
    };
    exports.clearTimeout = function (clearTimeout) {
        return function (timeoutId) {
            var args = arguments, self = this;
            return removeTimer(timeoutId, function () {
                return clearTimeout.apply(self, args);
            });
        };
    };
    exports.setImmediate = function (setImmediate) {
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
            });
            return idInfo.timeoutId;
        };
    };
    exports.clearImmediate = function (clearImmediate) {
        return function (immediateId) {
            var args = arguments, self = this;
            return removeTimer(immediateId, function () {
                return clearImmediate.apply(self, args);
            });
        };
    };
    exports.requestAnimationFrame = function (rAF) {
        return function (fn) {
            var callback = Zone.current.waitFor(fn);
            return rAF.call(this, callback);
        };
    };
    exports.then = function (then) {
        return function (onFulfilled, onRejected) {
            var fn;
            var rejected;
            var callback = Zone.current.waitFor(function (val) {
                if (fn) {
                    return fn.apply(this, arguments);
                } else if (rejected) {
                    val = typeof val === 'string' ? new Error(val) : val;
                    throw val;
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
    exports.send = function (send) {
        if (typeof supportsOnload === 'undefined') {
            supportsOnload = 'onload' in new XMLHttpRequest();
        }
        return function () {
            var onreadystatechange = this.onreadystatechange, onload = this.onload, onerror = this.onerror, thisXhr = this, zone = Zone.current;
            zone.addWait();
            if (supportsOnload) {
                this.onload = createCallback(onload);
                this.onerror = createCallback(onerror);
            } else {
                onreadystatechange = onreadystatechange || function () {
                };
                var callback = createCallback(onreadystatechange);
                this.onreadystatechange = function (ev) {
                    var xhr = ev ? ev.target : thisXhr;
                    if (xhr.readyState === 4) {
                        return callback.apply(this, arguments);
                    } else {
                        return onreadystatechange.apply(this, arguments);
                    }
                };
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
    exports.nextTick = function (nextTick) {
        return function (fn) {
            var callback = Zone.current.waitFor(fn);
            var args = slice.call(arguments, 1);
            args.unshift(callback);
            return nextTick.apply(process, args);
        };
    };
    exports.MutationObserver = function (MutationObserver) {
        return function (fn) {
            fn = Zone.current.wrap(fn);
            return new MutationObserver(fn);
        };
    };
});
/*lib/zone*/
define('can-zone', function (require, exports, module) {
    var g = require('can-zone/lib/env').global;
    var Promise = g.Promise;
    var globalsZone = require('can-zone/lib/zones/globals');
    var forEach = require('can-zone/lib/util').forEach;
    require('can-zone/register');
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
            if (!this.nestedTask)
                zone.execHookR('afterTask', this);
            if (this.catchErrors !== false) {
                zone.errors.push(err);
            } else {
                throw err;
            }
        }
        zone.runningTask = this.nestedTask;
        return res;
    };
    var hooks = [
        'beforeTask',
        'afterTask',
        'created',
        'ended',
        'beforeRun'
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
        this.ids = {};
        this.errors = [];
        this.data = {};
        this.globals = {};
        this.parent = Zone.current;
        this.hooks = slice.call(hooks);
        buildZoneSpec(this, spec, [globalsZone]);
        this.execHook('created');
    }
    Zone.waitFor = function (fn, catchErrors) {
        fn = fn || noop;
        var zone = Zone.current;
        if (!zone)
            return fn;
        return zone.waitFor(fn, catchErrors);
    };
    Zone.error = function (error) {
        var zone = Zone.current;
        if (!zone)
            return error;
        zone.errors.push(error);
        return error;
    };
    Zone.ignore = function (fn) {
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
        if (!this.waits || this.errors.length) {
            this.end();
        }
        return this.deferred.promise;
    };
    Zone.prototype.fork = function (zoneSpec) {
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
        this.execHook('ended');
        var dfd = this.deferred;
        if (this.errors.length) {
            var error = this.errors[0];
            error.errors = this.errors;
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
    g.Zone = g.Zone || Zone;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Zone;
    }
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();