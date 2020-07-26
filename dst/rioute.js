(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('riot')) :
    typeof define === 'function' && define.amd ? define(['exports', 'riot'], factory) :
    (global = global || self, factory(global.route = {}, global.riot));
}(this, (function (exports, riot) { 'use strict';

    /**
     * Tokenize input string.
     */
    function lexer(str) {
      var tokens = [];
      var i = 0;

      while (i < str.length) {
        var char = str[i];

        if (char === "*" || char === "+" || char === "?") {
          tokens.push({
            type: "MODIFIER",
            index: i,
            value: str[i++]
          });
          continue;
        }

        if (char === "\\") {
          tokens.push({
            type: "ESCAPED_CHAR",
            index: i++,
            value: str[i++]
          });
          continue;
        }

        if (char === "{") {
          tokens.push({
            type: "OPEN",
            index: i,
            value: str[i++]
          });
          continue;
        }

        if (char === "}") {
          tokens.push({
            type: "CLOSE",
            index: i,
            value: str[i++]
          });
          continue;
        }

        if (char === ":") {
          var name = "";
          var j = i + 1;

          while (j < str.length) {
            var code = str.charCodeAt(j);

            if ( // `0-9`
            code >= 48 && code <= 57 || // `A-Z`
            code >= 65 && code <= 90 || // `a-z`
            code >= 97 && code <= 122 || // `_`
            code === 95) {
              name += str[j++];
              continue;
            }

            break;
          }

          if (!name) throw new TypeError("Missing parameter name at " + i);
          tokens.push({
            type: "NAME",
            index: i,
            value: name
          });
          i = j;
          continue;
        }

        if (char === "(") {
          var count = 1;
          var pattern = "";
          var j = i + 1;

          if (str[j] === "?") {
            throw new TypeError("Pattern cannot start with \"?\" at " + j);
          }

          while (j < str.length) {
            if (str[j] === "\\") {
              pattern += str[j++] + str[j++];
              continue;
            }

            if (str[j] === ")") {
              count--;

              if (count === 0) {
                j++;
                break;
              }
            } else if (str[j] === "(") {
              count++;

              if (str[j + 1] !== "?") {
                throw new TypeError("Capturing groups are not allowed at " + j);
              }
            }

            pattern += str[j++];
          }

          if (count) throw new TypeError("Unbalanced pattern at " + i);
          if (!pattern) throw new TypeError("Missing pattern at " + i);
          tokens.push({
            type: "PATTERN",
            index: i,
            value: pattern
          });
          i = j;
          continue;
        }

        tokens.push({
          type: "CHAR",
          index: i,
          value: str[i++]
        });
      }

      tokens.push({
        type: "END",
        index: i,
        value: ""
      });
      return tokens;
    }
    /**
     * Parse a string for the raw tokens.
     */


    function parse(str, options) {
      if (options === void 0) {
        options = {};
      }

      var tokens = lexer(str);
      var _a = options.prefixes,
          prefixes = _a === void 0 ? "./" : _a;
      var defaultPattern = "[^" + escapeString(options.delimiter || "/#?") + "]+?";
      var result = [];
      var key = 0;
      var i = 0;
      var path = "";

      var tryConsume = function tryConsume(type) {
        if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
      };

      var mustConsume = function mustConsume(type) {
        var value = tryConsume(type);
        if (value !== undefined) return value;
        var _a = tokens[i],
            nextType = _a.type,
            index = _a.index;
        throw new TypeError("Unexpected " + nextType + " at " + index + ", expected " + type);
      };

      var consumeText = function consumeText() {
        var result = "";
        var value; // tslint:disable-next-line

        while (value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
          result += value;
        }

        return result;
      };

      while (i < tokens.length) {
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");

        if (name || pattern) {
          var prefix = char || "";

          if (prefixes.indexOf(prefix) === -1) {
            path += prefix;
            prefix = "";
          }

          if (path) {
            result.push(path);
            path = "";
          }

          result.push({
            name: name || key++,
            prefix: prefix,
            suffix: "",
            pattern: pattern || defaultPattern,
            modifier: tryConsume("MODIFIER") || ""
          });
          continue;
        }

        var value = char || tryConsume("ESCAPED_CHAR");

        if (value) {
          path += value;
          continue;
        }

        if (path) {
          result.push(path);
          path = "";
        }

        var open = tryConsume("OPEN");

        if (open) {
          var prefix = consumeText();
          var name_1 = tryConsume("NAME") || "";
          var pattern_1 = tryConsume("PATTERN") || "";
          var suffix = consumeText();
          mustConsume("CLOSE");
          result.push({
            name: name_1 || (pattern_1 ? key++ : ""),
            pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
            prefix: prefix,
            suffix: suffix,
            modifier: tryConsume("MODIFIER") || ""
          });
          continue;
        }

        mustConsume("END");
      }

      return result;
    }
    /**
     * Escape a regular expression string.
     */

    function escapeString(str) {
      return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
    }
    /**
     * Get the flags for a regexp from the options.
     */


    function flags(options) {
      return options && options.sensitive ? "" : "i";
    }
    /**
     * Pull out keys from a regexp.
     */


    function regexpToRegexp(path, keys) {
      if (!keys) return path; // Use a negative lookahead to match only capturing groups.

      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: "",
            suffix: "",
            modifier: "",
            pattern: ""
          });
        }
      }

      return path;
    }
    /**
     * Transform an array into a regexp.
     */


    function arrayToRegexp(paths, keys, options) {
      var parts = paths.map(function (path) {
        return pathToRegexp(path, keys, options).source;
      });
      return new RegExp("(?:" + parts.join("|") + ")", flags(options));
    }
    /**
     * Create a path regexp from string input.
     */


    function stringToRegexp(path, keys, options) {
      return tokensToRegexp(parse(path, options), keys, options);
    }
    /**
     * Expose a function for taking tokens and returning a RegExp.
     */


    function tokensToRegexp(tokens, keys, options) {
      if (options === void 0) {
        options = {};
      }

      var _a = options.strict,
          strict = _a === void 0 ? false : _a,
          _b = options.start,
          start = _b === void 0 ? true : _b,
          _c = options.end,
          end = _c === void 0 ? true : _c,
          _d = options.encode,
          encode = _d === void 0 ? function (x) {
        return x;
      } : _d;
      var endsWith = "[" + escapeString(options.endsWith || "") + "]|$";
      var delimiter = "[" + escapeString(options.delimiter || "/#?") + "]";
      var route = start ? "^" : ""; // Iterate over the tokens and create our regexp string.

      for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];

        if (typeof token === "string") {
          route += escapeString(encode(token));
        } else {
          var prefix = escapeString(encode(token.prefix));
          var suffix = escapeString(encode(token.suffix));

          if (token.pattern) {
            if (keys) keys.push(token);

            if (prefix || suffix) {
              if (token.modifier === "+" || token.modifier === "*") {
                var mod = token.modifier === "*" ? "?" : "";
                route += "(?:" + prefix + "((?:" + token.pattern + ")(?:" + suffix + prefix + "(?:" + token.pattern + "))*)" + suffix + ")" + mod;
              } else {
                route += "(?:" + prefix + "(" + token.pattern + ")" + suffix + ")" + token.modifier;
              }
            } else {
              route += "(" + token.pattern + ")" + token.modifier;
            }
          } else {
            route += "(?:" + prefix + suffix + ")" + token.modifier;
          }
        }
      }

      if (end) {
        if (!strict) route += delimiter + "?";
        route += !options.endsWith ? "$" : "(?=" + endsWith + ")";
      } else {
        var endToken = tokens[tokens.length - 1];
        var isEndDelimited = typeof endToken === "string" ? delimiter.indexOf(endToken[endToken.length - 1]) > -1 : // tslint:disable-next-line
        endToken === undefined;

        if (!strict) {
          route += "(?:" + delimiter + "(?=" + endsWith + "))?";
        }

        if (!isEndDelimited) {
          route += "(?=" + delimiter + "|" + endsWith + ")";
        }
      }

      return new RegExp(route, flags(options));
    }
    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     */

    function pathToRegexp(path, keys, options) {
      if (path instanceof RegExp) return regexpToRegexp(path, keys);
      if (Array.isArray(path)) return arrayToRegexp(path, keys, options);
      return stringToRegexp(path, keys, options);
    }

    class Dispatcher {
      /**
       * Create a new EventDispatcher instance.
       */
      constructor() {
        this._events = {};
      }
      /**
       * Destroy instance
       */


      destroy() {
        this._events = null;
      }
      /**
       * Start listening to the named event.
       * @param {String} name Event name.
       * @param {Function} callback Callback function.
       */


      addListener(name, callback) {
        // Check if name is a string.
        if (typeof name !== 'string') {
          return false;
        } // Check if callback is a function.


        if (typeof callback !== 'function') {
          return false;
        } // Check if event by name exists. If not add it.


        if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
          this._events[name] = [callback];
        } else {
          // Check if callback in event. If not add it.
          if (this._events[name].indexOf(callback) < 0) {
            this._events[name].push(callback);
          }
        }

        return true;
      }
      /**
       * Stop listening to the named event.
       * @param {String} name Event name.
       * @param {Function} callback Callback function.
       */


      removeListener(name, callback) {
        // Check if name is a string.
        if (typeof name !== 'string') {
          return false;
        } // Check if callback is a function.


        if (typeof callback !== 'function') {
          return false;
        } // Check if event by name exists.


        if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
          return;
        } // Check if event has callbacks.


        if (this._events[name].length <= 0) {
          return;
        }

        const index = this._events[name].indexOf(callback); // Check if callback in event. If so remove it.


        if (index >= 0) {
          this._events[name].splice(index, 1);
        }
      }
      /**
       * Remove all listeners listening to the named event.
       * @param {String} name Optional event name.
       */


      removeAllListeners(name) {
        // Check if event by name exists.
        if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
          return;
        } // Reset event with specified name.


        delete this._events[name];
      }
      /**
       * Invokes the callback functions matching the event name.
       * @param {String} name Event name.
       * @param {*} data Variables to give to the callback function.
       */


      dispatch(name) {
        for (var _len = arguments.length, data = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          data[_key - 1] = arguments[_key];
        }

        // Check if event by name exists.
        if (!Object.prototype.hasOwnProperty.call(this._events, name)) {
          return;
        } // Check if event has callbacks.


        if (this._events[name].length <= 0) {
          return;
        } // Execute callbacks.


        this._events[name].forEach(callback => {
          callback(...data);
        });
      }

    }

    /**
     * Check whether the value is an object.
     * @param {Any} value Value of unknown type.
     * @returns Whether the value is an object.
     */
    const isObject = function isObject(value) {
      return value && typeof value === 'object' && !Array.isArray(value);
    };
    /**
     * Deeply assign a series of objects properties together.
     * @param {Object} target Target object to merge to.
     * @param  {...Object} sources Objects to merge into the target.
     */


    const merge = function merge(target) {
      for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        sources[_key - 1] = arguments[_key];
      }

      if (!sources.length) {
        return target;
      }

      const source = sources.shift();

      if (isObject(target) && isObject(source)) {
        for (const key in source) {
          if (isObject(source[key])) {
            if (!target[key]) {
              Object.assign(target, {
                [key]: {}
              });
            }

            merge(target[key], source[key]);
          } else {
            Object.assign(target, {
              [key]: source[key]
            });
          }
        }
      }

      return merge(target, ...sources);
    };

    /**
     * Shorthand for parsing URL safely whether in the browser or in NodeJS.
     * @param  {...any} args Arguments for the URL parser.
     * @returns {URL} URL instance.
     */
    function parseURL () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (typeof window !== 'undefined') {
        return new URL(...args);
      }

      return require('url').url(...args);
    }

    // Import external modules.
    const pathToRegexpOptions = {
      sensitive: false,
      strict: false,
      end: true,
      start: true,
      delimiter: '/#?',
      encode: undefined,
      endsWith: undefined,
      prefixes: './'
    };
    class Route extends Dispatcher {
      constructor(path, options) {
        super();
        this._options = merge(pathToRegexpOptions, options);
        this.path = path;
        this._regexp = pathToRegexp(this.path, [], this._options);
      }

      destroy() {
        this._regexp = null;
        this.path = null;
        this._options = null;
        super.destroy();
      }
      /**
       * Check if path matches route
       * @param {*} path Path to match against
       */


      match(path) {
        return this._regexp.test(path);
      }

      parse(path) {
        const URL = parseURL(path);

        if (this._regexp) {
          const [, ...params] = this._regexp.exec(path);

          URL.params = params;
        }

        return URL;
      }

    }

    // Import local modules.

    class Router extends Dispatcher {
      constructor(options) {
        if (options === void 0) {
          options = null;
        }

        super();
        this._options = merge({
          basePath: null,
          updateHistory: null,
          pathToRegexp: pathToRegexpOptions
        }, options);
        this.pathCurrent = null;
        this.routeCurrent = null;
        this.routes = []; // Validate path type.

        this.methods = [path => [typeof path === 'string', path]]; // Remove basePath.

        if (this._options.basePath) {
          this.methods.push(path => [true, path.replace(this._options.basePath, '')]);
        }
      }

      destroy() {
        this.methods = null;

        for (const route in this.routes) {
          route.destroy();
        }

        this._options = null;
        super.destroy();
      }

      createRoute(path, options) {
        if (path === void 0) {
          path = null;
        }

        if (options === void 0) {
          options = null;
        }

        // Create new route.
        const route = new Route(path, merge(this._options.pathToRegexp, options)); // Add route to list.

        this.routes.push(route); // Dispatch create event.

        this.dispatch('create', {
          routes: this.routes,
          route: route
        }); // Return route.

        return route;
      }

      push(path) {
        // Execute methods on path.
        let pathNew = path;

        for (let i = 0; i < this.methods.length; i++) {
          const method = this.methods[i];
          const [success, value] = method(pathNew); // If not a success exit early.

          if (!success) {
            return false;
          } // Store resulting value.


          pathNew = value;
        }

        const pathIsNew = this.pathCurrent !== pathNew;
        this.pathCurrent = pathNew; // Find matching routes.

        let routeNew = null;

        for (let i = 0; i < this.routes.length; i++) {
          const route = this.routes[i];

          if (!route.match(pathNew)) {
            continue;
          } // Store current route.


          routeNew = route;
        }

        const routeIsNew = this.routeCurrent !== routeNew;
        this.routeCurrent = routeNew;

        if (pathIsNew) {
          // Update page history.
          if (this._options.updateHistory && typeof window !== 'undefined') {
            // Construct url.
            const url = path.includes(this._options.basePath) ? path : this._options.basePath + path; // Check if url is not current url.

            if (url !== window.history.location) {
              // Add path to history.
              window.history.pushState(null, window.document.title, url);
            }
          } // Dispatch event on router.


          this.dispatch('push', {
            router: this,
            route: this.routeCurrent,
            path: this.pathCurrent
          });
        }

        if (routeIsNew) {
          // Dispatch event on route.
          if (this.routeCurrent) {
            this.routeCurrent.dispatch('push', {
              router: this,
              route: this.routeCurrent,
              path: this.pathCurrent
            });
          }
        }
      }

      static parse(path) {
        return parseURL(path, this._options.basePath);
      }

    }

    const ROUTER_COMPONENT = Symbol('router');

    // Import external modules.

    const { template, bindingTypes } = riot.__.DOMBindings;

    var _route = {
      'css': null,

      'exports': riot.pure(({ slots, attributes, props }) => {
        const getAttribute = name => attributes && attributes.find(attribute => attribute.name === name);

        return {
          // Variables
          active: null,
          el: null,
          root: null,
          router: null,
          state: null,
          // Lifcycle methods.
          mount(element, context) {
            // Exit early if there are no slots.
            if (!slots || !slots.length) {
              return
            }

            this.active = false;
            this.el = this.root = element;
            this.state = {};

            // Add template.
            this.slot = template(null, [{
              type: bindingTypes.SLOT,
              name: 'default',
            }]);

            // Get router from parent component.
            this.router = context[ROUTER_COMPONENT].router;

            const path = this.root.getAttribute('path');
            if (!path) {
              throw new Error('No path found for route component.')
            }
            this.route = this.router.createRoute(path);

            this.handleRouteChange = ({ route }) => {
              const active = this.route === route;
              if (this.active === active) {
                return
              }
              this.active = active;

              // Update context.
              this.update(context);
            };

            this.router.addListener('push', this.handleRouteChange);
          },
          update(context) {
            if (this.active) {
              // Dispatch on mounted event.
              const onBeforeMount = getAttribute('onBeforeMount');
              if (onBeforeMount) {
                onBeforeMount.evaluate(context)(this, this.route, this.router.pathCurrent);
              }

              const element = document.createElement('div');
              this.root.appendChild(element);
              this.slot.mount(element, {
                slots,
              }, context);

              // Dispatch on mounted event.
              const onMounted = getAttribute('onMounted');
              if (onMounted) {
                onMounted.evaluate(context)(this, this.route, this.router.pathCurrent);
              }
            } else {
              // Dispatch on unmounted event.
              const onBeforeUnmount = getAttribute('onBeforeUnmount');
              if (onBeforeUnmount) {
                onBeforeUnmount.evaluate(context)(this, this.route, this.router.pathCurrent);
              }

              this.slot.unmount({
                slots,
              }, context, true);

              // Dispatch on unmounted event.
              const onUnmounted = getAttribute('onUnmounted');
              if (onUnmounted) {
                onUnmounted.evaluate(context)(this, this.route, this.router.pathCurrent);
              }
            }
          },
          unmount(...args) {
            // Stop listening to router changes
            this.router.removeListener('push', this.handleRouteChange);

            // Unmount slot.
            this.slot.unmount(...args);
          },
        }
      }),

      'template': null,
      'name': 'riouter-route'
    };

    // Import external modules.

    const { template: template$1, bindingTypes: bindingTypes$1 } = riot.__.DOMBindings;

    const defer = window.requestAnimationFrame || window.setTimeout;
    const cancelDefer = window.cancelAnimationFrame || window.clearTimeout;

    var _router = {
      'css': null,

      'exports': riot.pure(({ slots, attributes, props }) => {
        const getAttribute = name => attributes && attributes.find(attribute => attribute.name === name);

        const getBase = context => {
          const base = getAttribute('base');
          if (base) {
            return base.evaluate(context)
          }
          return window.location.protocol + '//' + window.location.host
        };

        return {
          // Variables.
          deferred: null,
          el: null,
          root: null,
          router: null,
          slot: null,
          // Lifecyle methods.
          mount(element, context) {
            if (!slots || !slots.length) {
              return
            }

            // Set root element.
            this.el = this.root = element;
            this.state = {};
            const updateHistory = getAttribute('updateHistory');
            this.router = new Router({
              basePath: getBase(),
              updateHistory: updateHistory && updateHistory !== 'false',
            });

            // Immidiatly push location.
            this.router.push(window.location.href);

            this.slot = template$1(null, [{
              type: bindingTypes$1.SLOT,
              name: 'default',
            }]);

            // Add this to context.
            context[ROUTER_COMPONENT] = this;

            const onBeforeStart = getAttribute('onBeforeStart');
            if (onBeforeStart) {
              onBeforeStart.evaluate(context)(this, this.router, this.router.pathCurrent);
            }

            this.slot.mount(this.root, {
              slots,
            }, context);

            const onStart = getAttribute('onStart');
            if (onStart) {
              onStart.evaluate(context)(this, this.router, this.router.pathCurrent);
            }
          },
          update(context) {
            // Defer update to prevent endless recursion.
            if (this.slot) {
              cancelDefer(this.deferred);

              this.deferred = defer(() => {
                this.slot.update({}, this);
              });
            }
          },
          unmount(...args) {
            // Unmount underlying components.
            if (this.slot) {
              this.slot.unmount(...args);
            }

            // Remove element.
            this.root.remove();

            // Destroy router.
            this.router.destroy();
          },
        }
      }),

      'template': null,
      'name': 'riouter-router'
    };

    const Route$1 = Route;
    const Router$1 = Router;
    const route = _route;
    const router = _router;
    var index = {
      Route: Route$1,
      Router: Router$1,
      route,
      router
    };

    exports.Route = Route$1;
    exports.Router = Router$1;
    exports.default = index;
    exports.route = route;
    exports.router = router;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
