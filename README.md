
# ducted

The purpose of `ducted` is to act as a general-purpose pipeline manager. A pipeline is built from
steps, each of which processes a context (synchronously or asynchronously). A step is typically
either a function or itself a pipeline.

It essentially tries to hit a sweet spot not far from streams and promises, but without doing
your head in and with a number of additional facilities that are useful when implementing a
pipeline.

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
