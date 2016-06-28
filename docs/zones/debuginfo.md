@typedef {Array<{}>} can-zone/debug.DebugInfo DebugInfo
@parent can-zone/debug

@description An array of objects containing information useful for debugging. Gives you the name of the **task** that failed to complete and a **stack** trace of where the error occured.

Each object has a shape of:

```js
{
	"task": "setTimeout",
	"stack": Error ...."
}
```

@option {String} task An identifier of the task that failed to complete. This can be any of the [asynchronous tasks](https://github.com/canjs/can-zone#tasks) supported by can-zone like `setTimeout` or `Promise`.


@option {String} stack A stack trace taken as a snapshot when the task was called. This allows you t see the source of the call to help debug why the task never completed.
