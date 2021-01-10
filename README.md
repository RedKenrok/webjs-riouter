<div align="center">

[![GitHub Repository](https://img.shields.io/static/v1?label=GitHub&message=%20&style=flat-square&color=green&logo=github&maxAge=3600)](https://github.com/redkenrok/webjs-riouter/)
[![License agreement](https://img.shields.io/github/license/redkenrok/webjs-riouter.svg?label=License&style=flat-square&maxAge=86400)](https://github.com/redkenrok/webjs-riouter/blob/master/LICENSE)
[![Open issues on GitHub](https://img.shields.io/github/issues/redkenrok/webjs-riouter.svg?label=Issues&style=flat-square&maxAge=86400)](https://github.com/redkenrok/webjs-riouter/issues)
[![npm @latest version](https://img.shields.io/npm/v/riouter.svg?label=Version&style=flat-square&maxAge=3600)](https://www.npmjs.com/package/riouter)

</div>

<hr/>

# Riouter

[Riot.js](https://github.com/riot) router.

## Differences with [@riot/route](https://github.com/riot/route#readme)

- Riouter can have multiple router instances on a single page. Even a router within a route is possible.
- Riouter can control whether the browsers session history is changed by the router.
- Riouter does not have a `initDomListeners` method. (It is trivial to write a solution yourself, see  the usage example below or the `example/src/app.html`'s `onRouterStart` function.)

## Install

```
npm install riouter
```

OR

```
yarn add riouter
```

## Usage

```HTML
<app>
  <router base="{ window.location.href }" onStarted="{ onRouterStarted }">
    <nav>
      <span route="home">
        Home
      </span>

      <span route="about">
        About
      </span>
    </nav>

    <route path="home">
      Home page
    </route>

    <route path="about">
      About page
    </route>
  </router>

  <script>
    // Import router components.
    import { router, route } from '../../src/index.js'

    export default {
      components: {
        // Router.
        route: route,
        router: router,
      },
      onRouterStarted(routerComponent, router) {
        // Get navigation elements.
        this.root.querySelectorAll('span[route]').forEach(links => {
          // Listen elements being clicked.
          links.addEventListener('click', (_event) => {
            // Get target with link.
            const target = _event.target.closest('span[route]')
            const targetRoute = target.getAttribute('route')
            // Check if route is set and not already active.
            if (!targetRoute || targetRoute === this.state.activeRoute) {
              return
            }
            // Invoke route change.
            this.state.activeRoute = targetRoute
            router.push(this.state.activeRoute)
          })
        })

        // Set initial router path to 'home'.
        this.state.activeRoute = 'home'
        router.push(this.state.activeRoute)
      },
    }
  </script>
</app>
```

## API

### router (component)

The `router` component wraps the `<route>`s and will manage whether they are active or not based on the state of the router. The component has the following attributes:

- `base`: Base path of the application.
  - Default: `''`
  - Type: String
- `updateHistory`: Whether to update the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
  - Default: `false`
  - Type: Boolean
- `onBeforeStart`: Called after the router is set up, but before the slot is mounted.
  - Default: `null`
  - Type: Function
  - Parameters:
    - Router component.
    - Router instance used by router.
- `onStarted`: Called after the slot has been mouted.
  - Default: `null`
  - Type: Function
  - Parameters:
    - Router component.
    - Router instance used by router.

### route (component)

The `route` component wraps the content that should be visible when the acompyoning route is active. The component has the following attributes:

- `path`: The path to which the URL should match for this route to become active.
  - Required: `true`
  - Type: String
- `onBeforeMount`: Lifecycle function called before the rout is mounted.
  - Default: `null`
  - Type: Function
  - Parameters:
    - Route component.
    - Router instance used by router.
    - Route's path.
- `onMounted`: Lifecycle function called after the rout is mounted.
  - Default: `null`
  - Type: Function
  - Parameters:
    - Route component.
    - Router instance used by router.
    - Route's path.
- `onBeforeUnmount`: Lifecycle function called before the rout is unmounted.
  - Default: `null`
  - Type: Function
  - Parameters:
    - Route component.
    - Router instance used by router.
    - Route's path.
- `onUnmounted`: Lifecycle function called after the rout is unmounted.
  - Default: `null`
  - Type: Function
  - Parameters:
    - Route component.
    - Router instance used by router.
    - Route's path.

### Router

Underneath the `router` and `route` components use a router to manage its state. The instance used can be interacted with by listening to the events of the components. The router extends the [Dispatcher](#dispatcher) and has the following functions:

- `constructor`: Creates a router instance.
  - Parameters
    - `options`: Options for the router.
      - Default: `null`
      - Type: Object
      - Properties:
        - `basePath`: Base path of the application.
          - Default: `''`
          - Type: String
        - `updateHistory`: Whether to update the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
          - Default: `false`
          - Type: Boolean
        - `pathToRegexp`: Options for [path-to-regexp](https://github.com/pillarjs/path-to-regexp#usage).
          - Default: `{}`
          - Type: Object
- `destroy`: Destory instance.
- `getPath`: Get the current path.
  - Returns: The current path.
    - Type: String
- `getRoute`: Get the current route.
  - Returns: The current route.
    - Type: String
- `addRoute`: Add route to router.
  - Parameters
    - `path`: Route's path.
      - Required: true
      - Type: String
    - `options`: Options for [path-to-regexp](https://github.com/pillarjs/path-to-regexp#usage).
      - Default: `{}`
      - Type: Object
- `removeRoute`: Remove route from router.
  - Parameters
    - `path`: Route's path.
      - Required: true
      - Type: String
- `getRoutes`: Get all routes part of the router.
  - Returns: Array of strings, all paths of routes in router.
- `push`: Push path to router, potentially changing active router.
  - Parameters
    - `path`: Path to push.
      - Required: true
      - Type: String
  - Returns: Boolean, whether a matching route was found.

The router dispatches the following events:

- `added`: Dispatched when a new route has been added to the router using `addRoute`.
  - Data:
    - `route`: The path of the added route.
      - Type: String
    - `router`: The router instance to which the route has been added.
      - Type: Router
- `pushed`: Dispatched when a new path has been pushed to the router using `push`.
  - Data:
    - `path`: The path which has been pushed.
      - Type: String
    - `router`: The router instance to which the path has been pushed.
      - Type: Router
    - `route`: The route matching the path.
      - Type: String

> The router can be used seperatly from the components by importing the `Router.js` file in the root of the project: `import Router from 'riouter/Router.js'`.

### Dispatcher

The `Dispatcher` class is extended by the `Router` class and deals with handling and dispatching events. It has the following functions:

- `constructor`: Creates a dispatcher instance.
- `destroy`: Destory instance.
- `addListener`: Start listening to the named event.
  - Parameters
    - `name`: Event name.
      - Required: true
      - Type: String
    - `callback`: Callback function.
      - Required: true
      - Type: Function
- `removeListener`: Stop listening to the named event.
  - Parameters
    - `name`: Event name.
      - Required: true
      - Type: String
    - `callback`: Callback function.
      - Required: true
      - Type: Function
- `removeAllListeners`: Remove all listeners listening to the dispatcher or just the named events.
  - Parameters
    - `name`: Event name.
      - Default: `null`
      - Type: String
- `dispatch`: Invokes the callback functions matching the event name.
  - Parameters
    - `name`: Event name.
      - Required: true
      - Type: String
    - `...data`: Data for callback.
      - Required: false
      - Type: Any

## Lazy loading with [@riotjs/lazy](https://github.com/riot/lazy#readme)

The router also supports lazy loading. Simply use [@riotjs/lazy](https://github.com/riot/lazy#readme) as you would otherwise. The components will be lazily loaded once the route they are part of becomes active.

```HTML
<app>
  <router base="{ window.location.href }" onStarted="{ onRouterStarted }">
    <nav>
      <span route="home">
        Home
      </span>

      <span route="about">
        About
      </span>
    </nav>

    <route path="home">
      <home />
    </route>

    <route path="about">
      <about />
    </route>
  </router>

  <script>
    // Import riot lazy.
    import lazy from '@riotjs/lazy'

    // Import router components.
    import { router, route } from '../../src/index.js'

    export default {
      components: {
        // Router.
        route: route,
        router: router,
        // Pages.
        home: lazy(() => import('./home.riot')),
        about: lazy(() => import('./about.riot')),
      },
      onRouterStarted(routerComponent, router) {
        // Listen to clicks and update router. See example above.
      }
    }
  </script>
</app>
```
