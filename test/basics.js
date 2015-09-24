
import assert from 'assert';
import { pipe } from '..';

describe('a basic pipeline', function () {
  // runs just one
  it('should run a simple func', function (done) {
    let duct = pipe();
    duct.step(ctx => { ctx.data.gotIt = true; ctx.done(); });
    duct.on('duct:end', (data) => {
      assert(data.gotIt, 'ran the one step');
      done();
    });
    duct.run();
  });

  // runs all three
  it('should run several simple funcs', function (done) {
    let duct = pipe();
    duct.step(ctx => { ctx.data.one = 1; ctx.done(); })
        .step(ctx => { ctx.data.two = ctx.data.one + 1; ctx.done(); })
        .step(ctx => { ctx.data.three = ctx.data.two + 1; ctx.done(); })
      .on('duct:end', (data) => {
        assert.equal(data.one, 1, 'ran first step');
        assert.equal(data.two, 2, 'ran second step');
        assert.equal(data.three, 3, 'ran third step');
        done();
      })
      .run()
    ;
  });

  // other syntax
  it('should run steps using the immediate pipe() syntax', function (done) {
    pipe(
      ctx => { ctx.data.one = 1; ctx.done(); },
      ctx => { ctx.data.two = ctx.data.one + 1; ctx.done(); },
      ctx => { ctx.data.three = ctx.data.two + 1; ctx.done(); }
    )
    .on('duct:end', (data) => {
      assert.equal(data.one, 1, 'ran first step');
      assert.equal(data.two, 2, 'ran second step');
      assert.equal(data.three, 3, 'ran third step');
      done();
    })
    .run();
  });

  // runs empty
  it('should run successfully with no step', function (done) {
    let duct = pipe();
    duct.on('duct:end', (data) => {
      assert(true, 'reached the end of zero steps');
      done();
    });
    duct.run();
  });

  // initialData
  it('takes initialData into account', function (done) {
    let duct = pipe();
    duct.step(ctx => { ctx.data.copy = ctx.data.original; ctx.done(); });
    duct.on('duct:end', (data) => {
      assert.equal(data.original, 'here', 'the initialData made it through');
      assert.equal(data.copy, 'here', 'the initialData was in the steps');
      done();
    });
    duct.run({ original: 'here' });
  });

  // basic events (only warnings at this point)
  it('emits basics events', function (done) {
    let duct = pipe()
      , warns = []
    ;
    duct.on('duct:warn', (msg) => warns.push(msg));
    duct.step(ctx => { ctx.warn('one'); ctx.done(); });
    duct.step(ctx => { ctx.warn('two'); ctx.done(); });
    duct.step(ctx => { ctx.warn('three'); ctx.done(); });
    duct.on('duct:end', (data) => {
      assert.deepEqual(warns, ['one', 'two', 'three'], 'warn() was called three times');
      done();
    });
    duct.run();
  });

  // errors
  it('emits errors and stops the flow', function (done) {
    let duct = pipe()
      , seenStep = false
      , seenError = 0
    ;
    duct.on('duct:warn', (msg) => warns.push(msg));
    duct.step(ctx => { seenStep = true; ctx.done(); });
    duct.step(ctx => { ctx.error(new Error('BOOM!')); });
    duct.step(ctx => { assert(false, 'this step should not run'); ctx.done(); });
    duct.on('duct:error', (err, data) => {
      assert.equal(err.message, 'BOOM!', 'error message came through');
      assert.equal(data.hi, 'error', 'initialData came through');
      seenError = true;
    });
    duct.on('duct:end', (data) => {
      assert(seenStep, 'the step before the error ran');
      assert(seenError, 'the error handler ran before us');
      done();
    });
    duct.run({ hi: 'error' });
  });

  // sub-pipelines
  it('runs sub-pipelines', function (done) {
    let duct = pipe()
      , subduct = pipe() // so many puns!
    ;
    duct.step(ctx => { ctx.data.seen++; ctx.done(); });
    subduct.step(ctx => { ctx.data.seen++; ctx.data.fromSub = true; ctx.done(); });
    duct.step(subduct);
    duct.step(ctx => { ctx.data.seen++; ctx.done(); });
    duct.on('duct:end', (data) => {
      assert.equal(data.seen, 3, 'three steps ran');
      assert(data.fromSub, 'including one from a sub-pipeline');
      done();
    });
    duct.run({ seen: 0 });
  });

  // independent context
  it('has independent contexts', function (done) {
    let duct = pipe()
      , seen = 0
      , seenBoth = () => {
          seen++;
          if (seen === 2) done();
        }
    ;
    duct.step(ctx => {
      if (ctx.seenThis) return ctx.error('Can\'t see this.');
      ctx.seenThis = true;
      ctx.done();
    });
    duct.on('duct:error', () => {
      assert(false, 'contexts weren\'t independent');
    });
    duct.on('duct:end', (data) => {
      assert(true, 'got to the end without error');
      seenBoth();
    });
    duct.run();
    duct.run();
  });

  // run() returns its context
  it('should return a context from run()', function (done) {
    let duct = pipe();
    duct.step(ctx => { ctx.data.pristine = false; ctx.done(); });
    duct.on('duct:end', (data) => {
      assert(!data.pristine, 'step did modify');
      assert(!data.touched, 'not touched yet!');
      done();
    });
    let ctx = duct.run({ pristine: true, original: true });
    ctx.data.touched = true;
    assert(ctx.data.original, 'context was returned with set data');
  });
});
