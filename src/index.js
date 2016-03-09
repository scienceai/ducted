
import { EventEmitter } from 'events';
import Context from './context';

// events are in the ducted: namespace
// steps can be funcs that get the context object, or pipelines that are .run() with the context
// calls to configuration methods chain (step(), on()) so that you can make nice chains

export function pipe (...steps) {
  let p = new PipeDuct();
  steps.forEach(s => p.step(s));
  return p;
}

export class Ducted extends EventEmitter {}

export class PipeDuct extends Ducted {
  constructor () {
    super();
    this._pipeline = [];
  }

  // this can take a context, or just the data
  // returns the context so that one can work on it
  run (initialData = {}) {
    let ctx = (initialData instanceof Context) ? initialData : new Context(initialData);
    this._current = -1;
    this._runNext(ctx);
    return ctx;
  }

  _runNext (ctx) {
    this._current++;
    if (this._current >= this._pipeline.length) {
      this.emit('ducted:end', ctx.data);
      return;
    }
    let step = this._pipeline[this._current]
      , onError = (err, data) => {
          this.emit('ducted:error', err, data);
          this.emit('ducted:end', data);
        }
      , onWarn = (msg) => this.emit('ducted:warn', msg)
      , onEnd = () => {
          ctx.removeListener('ducted:warn', onWarn);
          if (!ctx.hasErrored) {
            ctx.removeListener('ducted:error', onError);
            this._runNext(ctx);
          }
        }
    ;
    ctx.once('ducted:end', onEnd);
    ctx.once('ducted:error', onError);
    ctx.on('ducted:warn', onWarn);
    if (step instanceof Ducted) step.run(ctx);
    else step(ctx);
  }

  // add a function or sub-pipeline to the pipeline
  step (func) {
    this._pipeline.push(func);
    return this;
  }
}

// TODO:
//  - add validation support for steps (like PropTypes)
//  - support for parallelism and dynamic steps (e.g. that run multiple times on a list of input)
//  - documentation
//  - handle exceptions
