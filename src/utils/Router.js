// Import local modules.
import Dispatcher from './Dispatcher.js'
import merge from './merge.js'
import parseURL from './parseURL.js'
import { pathToRegexpOptions, Route } from './Route.js'

class Router extends Dispatcher {
  constructor(options = null) {
    super()

    this._options = merge({
      basePath: null,
      updateHistory: null,

      pathToRegexp: pathToRegexpOptions,
    }, options)

    this.pathCurrent = null
    this.routeCurrent = null

    this.routes = []

    // Validate path type.
    this.methods = [
      path => [typeof (path) === 'string', path],
    ]

    // Remove basePath.
    if (this._options.basePath) {
      this.methods.push(
        path => [true, path.replace(this._options.basePath, '')]
      )
    }
  }

  destroy() {
    this.methods = null

    for (const route in this.routes) {
      route.destroy()
    }

    this._options = null

    super.destroy()
  }

  createRoute(path = null, options = null) {
    // Create new route.
    const route = new Route(path, merge(this._options.pathToRegexp, options))

    // Add route to list.
    this.routes.push(route)

    // Dispatch create event.
    this.dispatch('create', {
      routes: this.routes,
      route: route,
    })

    // Return route.
    return route
  }

  push(path) {
    // Execute methods on path.
    let pathNew = path
    for (let i = 0; i < this.methods.length; i++) {
      const method = this.methods[i]

      const [success, value] = method(pathNew)
      // If not a success exit early.
      if (!success) {
        return false
      }
      // Store resulting value.
      pathNew = value
    }
    const pathIsNew = this.pathCurrent !== pathNew
    this.pathCurrent = pathNew

    // Find matching routes.
    let routeNew = null
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i]
      if (!route.match(pathNew)) {
        continue
      }

      // Store current route.
      routeNew = route
    }
    const routeIsNew = this.routeCurrent !== routeNew
    this.routeCurrent = routeNew

    if (pathIsNew) {
      // Update page history.
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
      this.dispatch('push', {
        router: this,
        route: this.routeCurrent,
        path: this.pathCurrent,
      })
    }

    if (routeIsNew) {
      // Dispatch event on route.
      if (this.routeCurrent) {
        this.routeCurrent.dispatch('push', {
          router: this,
          route: this.routeCurrent,
          path: this.pathCurrent,
        })
      }
    }
  }

  static parse(path) {
    return parseURL(path, this._options.basePath)
  }
}

export default Router
