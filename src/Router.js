// Import external modules.
import { pathToRegexp } from 'path-to-regexp'
// Import local modules.
import Dispatcher from './util/Dispatcher.js'

class Router extends Dispatcher {
  constructor(options = null) {
    super()

    // Overwrite default with given options.
    this._options = Object.assign({
      basePath: '',
      updateHistory: false,
      pathToRegexp: {},
    }, options)

    this._pathCurrent = null
    this._routes = {}
    this._routeCurrent = null
  }

  destroy () {
    this._options = null
    this._pathCurrent = null
    this._routeCurrent = null
    this._routes = null

    super.destroy()
  }

  getPath () {
    return this._pathCurrent
  }

  addRoute (path, options = {}) {
    // Create routes test function.
    const regexp = pathToRegexp(path, [], options)
    const test = (_path) => {
      return regexp.test(_path)
    }

    // Add route to list.
    this._routes[path] = test

    // Dispatch add event.
    this.dispatch('added', {
      route: path,
      router: this,
    })
  }

  removeRoute (path) {
    delete this._routes[path]
  }

  getRoutes () {
    return Object.keys(this._routes)
  }

  push (path) {
    // Remove base url, if present.
    const pathNew = path.replace(this._options.basePath, '')
    if (this._pathCurrent === pathNew) {
      return true
    }

    // Find matching routes.
    let routeNew = null
    for (const routePath in this._routes) {
      const match = this._routes[routePath]
      if (!match(pathNew)) {
        continue
      }

      routeNew = routePath
      break
    }

    if (!routeNew) {
      return false
    }
    this._pathCurrent = pathNew
    this._routeCurrent = routeNew

    // Update page history if options set and window global exists.
    if (this._options.updateHistory && typeof window !== 'undefined') {
      // Construct url.
      const url = path.includes(this._options.basePath) ? path : this._options.basePath + path
      // Check if url is not current url.
      if (url !== window.history.location) {
        // Add path to history.
        window.history.pushState(null, window.document.title, url)
      }
    }

    // Dispatch event on router.
    this.dispatch('pushed', {
      path: this._pathCurrent,
      router: this,
      route: this._routeCurrent,
    })

    return true
  }
}

export default Router
