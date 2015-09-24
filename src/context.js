
import { EventEmitter } from 'events';

// The purpose of the context object is to encapsulate the relationship of steps to the pipeline.
// It contains the data and exposes methods that can manipulate the flow and report data.

export default class Context extends EventEmitter {
  constructor (initialData = {}) {
    this.data = initialData;
  }

  // signal that the module is done and move on to the next
  done () {
    this.emit('duct:end', this.data);
  }

  // an irrecoverable error has happened
  error (err) {
    if (typeof err === 'string') err = new Error(err);
    this.emit('duct:error', err);
  }

  // warning
  warn (str) {
    this.emit('duct:warning', str);
  }
}

// TODO:
//  - helper to run Web Workers isomorphically
//  - progress?
