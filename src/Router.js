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

  createRoute (path, options = {}) {
    // Create new route.
    const regexp = pathToRegexp(path, [], options)
    const match = (_path) => {
      return regexp.test(_path)
    }

    // Add route to list.
    this._routes[path] = match

    // Dispatch create event.
    this.dispatch('created', {
      route: path,
      router: this,
    })

    // Return route.
    return path
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
    const pathIsNew = this._pathCurrent !== pathNew
    this._pathCurrent = pathNew

    // Find matching routes.
    for (const routePath in this._routes) {
      const match = this._routes[routePath]
      if (!match(this._pathCurrent)) {
        continue
      }

      this._routeCurrent = routePath
      break
    }

    if (pathIsNew) {
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
        route: this._routeCurrent,
        router: this,
      })
    }
  }
}

export default Router
