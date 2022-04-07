// Import external modules.
import bindingTypes from '@riotjs/util/binding-types.js'
import template from '@riotjs/dom-bindings/src/template.js'

// Import internal libraries.
import { pure } from 'riot'
import { ROUTER_COMPONENT } from '../util/symbols.js'

export default {
  name: 'route',
  exports: pure((data) => {
    const getAttribute = name => data && data.attributes && data.attributes.find(attribute => attribute.name === name)

    return {
      // Lifecycle methods.
      mount (element, context) {
        // Exit early if there are no slots.
        if (!data || !data.slots || !data.slots.length) {
          return
        }

        this.active = false
        this.el = this.root = element
        this.state = {}

        // Add template.
        this.slot = template(null, [{
          type: bindingTypes.SLOT,
          name: 'default',
        }])

        // Get router from parent component.
        this.router = context[ROUTER_COMPONENT].router

        this.route = this.root.getAttribute('path')
        if (!this.route) {
          throw new Error('No path found for route component.')
        }
        this.router.addRoute(this.route)

        this.handleRouteChange = ({ route }) => {
          const active = this.route === route
          if (this.active === active) {
            return
          }
          this.active = active

          // Update context.
          this.update(context)
        }

        this.router.addListener('pushed', this.handleRouteChange)
      },
      unmount (...args) {
        // Stop listening to router changes
        this.router.removeListener('pushed', this.handleRouteChange)

        // Remove route from router.
        this.router.removeRoute(this.route)

        // Unmount slot.
        this.slot.unmount(...args)
      },
      update (context) {
        if (this.active) {
          // Dispatch on mounted event.
          const onBeforeMount = getAttribute('onBeforeMount')
          if (onBeforeMount) {
            onBeforeMount.evaluate(context)(this, this.router, this.route)
          }

          const element = document.createElement('div')
          this.root.appendChild(element)
          this.slot.mount(element, {
            slots: data.slots,
          }, context)

          // Dispatch on mounted event.
          const onMounted = getAttribute('onMounted')
          if (onMounted) {
            onMounted.evaluate(context)(this, this.router, this.route)
          }
        } else {
          // Dispatch on unmounted event.
          const onBeforeUnmount = getAttribute('onBeforeUnmount')
          if (onBeforeUnmount) {
            onBeforeUnmount.evaluate(context)(this, this.router, this.route)
          }

          this.slot.unmount({
            slots: data.slots,
          }, context, true)

          // Dispatch on unmounted event.
          const onUnmounted = getAttribute('onUnmounted')
          if (onUnmounted) {
            onUnmounted.evaluate(context)(this, this.router, this.route)
          }
        }
      },
    }
  }),
}
