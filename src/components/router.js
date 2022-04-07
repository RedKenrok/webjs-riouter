// Import external modules.
import bindingTypes from '@riotjs/util/binding-types.js'
import template from '@riotjs/dom-bindings/src/template.js'

// Import internal libraries.
import Router from '../Router.js'
import { pure } from 'riot'
import { ROUTER_COMPONENT } from '../util/symbols.js'

const defer = window.requestAnimationFrame || window.setTimeout
const cancelDefer = window.cancelAnimationFrame || window.clearTimeout

export default {
  name: 'router',
  exports: pure((data) => {
    const getAttribute = name => data && data.attributes && data.attributes.find((attribute) => attribute.name === name)

    const getBase = (context) => {
      const base = getAttribute('base')
      if (base) {
        return base.evaluate(context)
      }
      return window.location.protocol + '//' + window.location.host
    }

    return {
      // Lifecycle methods.
      mount (element, context) {
        if (!data || !data.slots || !data.slots.length) {
          return
        }

        // Set root element.
        const routerElement = document.createElement('div')
        element.appendChild(routerElement)
        this.el = this.root = routerElement

        this.state = {}
        let updateHistory = getAttribute('updateHistory')
        updateHistory = updateHistory ? (!!updateHistory.evaluate(context)) : false
        this.router = new Router({
          basePath: getBase(),
          updateHistory: updateHistory,
        })

        // Immidiatly push location.
        this.router.push(window.location.href)

        this.slot = template(null, [{
          type: bindingTypes.SLOT,
          name: 'default',
        }])

        // Add this to context.
        context[ROUTER_COMPONENT] = this

        const onBeforeStart = getAttribute('onBeforeStart')
        if (onBeforeStart) {
          onBeforeStart.evaluate(context)(this, this.router)
        }

        this.slot.mount(this.root, {
          slots: data.slots,
        }, context)

        const onStarted = getAttribute('onStarted')
        if (onStarted) {
          onStarted.evaluate(context)(this, this.router)
        }
      },
      unmount (...args) {
        // Unmount underlying components.
        if (this.slot) {
          this.slot.unmount(...args)
        }

        // Remove element.
        this.root.remove()

        // Destroy router.
        this.router.destroy()
      },
      update () {
        // Defer update to prevent endless recursion.
        if (this.slot) {
          if (this.deferred) {
            cancelDefer(this.deferred)
          }

          this.deferred = defer(() => {
            this.slot.update({}, this)
          })
        }
      },
    }
  }),
}
