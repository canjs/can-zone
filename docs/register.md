@module {function} can-zone/register can-zone/register
@parent can-zone.modules

@description

In order to do it's magic, [can-zone] has to register handlers for all of the common JavaScript async operations. If you have code (or a dependency with this code) that does:

```js
var st = setTimeout;
```

And this module loads before can-zone, any time `st` is used we won't be able to track that within the Zone.

To work around this, **can-zone/register** is used as a script that you run before any other modules.

### In Node

```js
require("can-zone/register");
```

At the top of your entry-point script.

### In the Browser

You can either add a script tag above all others:

```js
<script src="node_modules/can-zone/register.js"></script>
```

Or, if you're using a module loader / bundler, configure it so that can-zone/register is placed above all others in the bundle.
