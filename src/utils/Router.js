// Import local modules.
import Dispatcher from './Dispatcher.js'
import ObjectUtils from './ObjectUtils.js'
import { pathToRegexpOptions, Route } from './Route.js'

class Router extends Dispatcher {
  constructor(options = null) {
    super()

    this._options = ObjectUtils.deepAssign({
      basePath: null,
      updateHistory: false,

      pathToRegexp: pathToRegexpOptions,
    }, options)

    this.pathCurrent = null
    this.routeCurrent = null

    this.routes = []
  }

  destroy () {
    for (const route in this.routes) {
      route.destroy()
    }

    this._options = null

    super.destroy()
  }

  createRoute (path = null, options = null) {
    // Create new route.
    const route = new Route(path, ObjectUtils.deepAssign(this._options.pathToRegexp, options))

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

  push (path) {
    // Check type.
    if (typeof (path) !== 'string') {
      return false
    }

    // Remove base url, if present.
    const pathNew = path.replace(this._options.basePath, '')
    const pathIsNew = this.pathCurrent !== pathNew
    this.pathCurrent = pathNew

    // Find matching routes.
    let routeNew = null
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i]
      if (!route.match(this.pathCurrent)) {
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
}

export default Router
