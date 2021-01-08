// Import external modules.
import { pathToRegexp } from 'path-to-regexp'
// Import internal modules.
import Dispatcher from './Dispatcher.js'
import ObjectUtils from './ObjectUtils.js'

export const pathToRegexpOptions = {
  sensitive: false,
  strict: false,
  end: true,
  start: true,
  delimiter: '/#?',
  encode: undefined,
  endsWith: undefined,
  prefixes: './',
}

export class Route extends Dispatcher {
  constructor(path, options) {
    super()

    this._options = ObjectUtils.deepAssign(pathToRegexpOptions, options)

    this.path = path

    this._regexp = pathToRegexp(this.path, [], this._options)
  }

  destroy () {
    this._regexp = null
    this.path = null
    this._options = null

    super.destroy()
  }

  /**
   * Check if path matches route
   * @param {String} path Path to match against
   */
  match (path) {
    return this._regexp.test(path)
  }
}

export default Route
