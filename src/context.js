
import { EventEmitter } from 'events';

// The purpose of the context object is to encapsulate the relationship of steps to the pipeline.
// It contains the data and exposes methods that can manipulate the flow and report data.

export default class Context extends EventEmitter {
  constructor (initialData = {}) {
    super();
    this.data = initialData;
  }

  // signal that the module is done and move on to the next
  done () {
    this.emit('duct:end', this.data);
  }

  // an irrecoverable error has happened
  error (err) {
    if (typeof err === 'string') err = new Error(err);
    this.hasErrored = true;
    this.emit('duct:error', err, this.data);
    this.emit('duct:end', this.data);
  }

  // warning
  warn (str) {
    this.emit('duct:warn', str);
  }
}

// TODO:
//  - helper to run Web Workers isomorphically
//  - progress?
