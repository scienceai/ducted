
import { EventEmitter } from 'events';
import { Context } from './context';

// events are in the duct: namespace
// steps can be funcs that get the context object, or pipelines that are .run() with the context

export default class Ducted extends EventEmitter {
  constructor () {
    this._pipeline = [];
  }

  // this can take a context, or just the data
  run (initialData = {}) {
    let ctx = (initialData instanceof Context) ? initialData : new Context(initialData);
    this._current = -1;
    this._runNext(ctx);
  }

  _runNext (ctx) {
    this._current++;
    if (this._current >= this._pipeline.length) {
      this.emit('duct:end', ctx.data);
      return;
    }
    let step = this._pipeline[this._current];
    step.once('duct:end', () => this._runNext(ctx));
    if (step instanceof Ducted) step.run(ctx);
    else step(ctx);
  }

  // add a function or sub-pipeline to the pipeline
  step (func) {
    this._pipeline.push(func);
  }
}

// TODO:
//  - add validation support for steps (like PropTypes)
//  - support for parallelism and dynamic steps (e.g. that run multiple times on a list of input)
