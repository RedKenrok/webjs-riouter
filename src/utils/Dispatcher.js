class Dispatcher {
  /**
   * Create a new EventDispatcher instance.
   */
  constructor() {
    this._events = {}
  }

  /**
   * Destroy instance
   */
  destroy () {
    this._events = null
  }

  /**
   * Start listening to the named event.
   * @param {String} name Event name.
   * @param {Function} callback Callback function.
   */
  addListener (name, callback) {
    // Check if event by name exists. If not add it.
    if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
      this._events[name] = [
        callback,
      ]
    } else {
      // Check if callback in event. If not add it.
      if (this._events[name].indexOf(callback) < 0) {
        this._events[name].push(callback)
      }
    }

    return true
  }

  /**
   * Stop listening to the named event.
   * @param {String} name Event name.
   * @param {Function} callback Callback function.
   */
  removeListener (name, callback) {
    // Check if event by name exists.
    if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
      return
    }
    // Check if event has callbacks.
    if (this._events[name].length <= 0) {
      return
    }

    const index = this._events[name].indexOf(callback)
    // Check if callback in event. If so remove it.
    if (index >= 0) {
      this._events[name].splice(index, 1)
    }
  }

  /**
   * Remove all listeners listening to the named event.
   * @param {String} name Optional event name.
   */
  removeAllListeners (name) {
    // Check if event by name exists.
    if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
      return
    }

    // Reset event with specified name.
    delete this._events[name]
  }

  /**
   * Invokes the callback functions matching the event name.
   * @param {String} name Event name.
   * @param {*} data Variables to give to the callback function.
   */
  dispatch (name, ...data) {
    // Check if event by name exists.
    if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
      return
    }
    // Check if event has callbacks.
    if (this._events[name].length <= 0) {
      return
    }

    // Execute callbacks.
    this._events[name].forEach(callback => {
      callback(...data) // eslint-disable-line
    })
  }
}

export default Dispatcher
