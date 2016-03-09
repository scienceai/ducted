
# ducted

The purpose of `ducted` is to act as a general-purpose pipeline manager. A pipeline is built from
steps, each of which processes a context (synchronously or asynchronously). A step is typically
either a function or itself a pipeline.

Pipelines can be dynamically composed, which means that the shape of a pipeline can change at
runtime based on its input.

An example, even a stupid one like the following, should give you an idea.

```js
import { pipe } from 'ducted';
import fs from 'fs';
pipe(
  ctx => fs.readFile(ctx.data.source, 'utf8', (err, content) => {
          if (err) ctx.error(err);
          ctx.content = content;
          ctx.done();
        }),
  ctx => {
          if (/unicorn/i.test(ctx.data.content)) ctx.warn('Shh, do not mention the unicorns.');
          ctx.done();
  },
  ctx => { ctx.data.content = ctx.data.content.toUpperCase(); ctx.done(); },
  ctx => fs.writeFile(ctx.data.output, ctx.data.content, 'utf8', (err) => {
            if (err) ctx.error(err);
            ctx.done();
        })
)
.on('duct:end', (data) => {
  console.log('Uppercased some data');
})
.run({ source: 'in.txt', output: 'out.txt' });
```

Obviously, the above example is pretty contrived. It would be a lot easier to just code it out
without `ducted`. But `ducted` starts to shine in more elaborate pipelines, with more complex
flows, and when code is reused and pipelines get composed.

## Installation

The usual `npm install ducted`.

## API

Ducted is largely a chained API, with event handlers to communicate back up the pipeline structure.

First, import it:

```js
import { pipe } from 'ducted';
// or in ES5
var pipe = require('ducted').pipe;
```

### `pipe(...steps)`

You can pass in as many steps as you want to `pipe()` (including none) and they will be configured
as steps in the pipeline, in the given order. In fact, `pipe(foo, bar)` is the same as calling
`pipe().addStep(foo).addStep(bar)`. The manner in which steps are called is detailed below.

### `addStep(step)`

Adds a single step to the end of the pipeline.

### `on('event', handler)`

Registers a handler for a given event. Some `ducted`-specific events are dispatched, but in general
any step can dispatch events up the nested pipelines. This is in fact an `EventEmitter` subclass,
so the usual event methods are available.

### `run(initialData)`

Actually runs the pipeline, using the provided data as what is given to the first step in the
pipeline.

### events: ducted:end, ducted:warn, ducted:error

These events are dispatched at various moments:

* `ducted:end`. The pipeline finished, not necessarily successfully (i.e. an error will also trigger
  this). It gets the data in the state at which the pipeline ends.
* `ducted:warn`. A warning was emitted (passed as a string).
* `ducted:error`. A fatal error, the pipeline was interrupted.

### Steps and Contexts
