(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.App = factory());
}(this, (function () { 'use strict';

  /* Riot v5.1.2, @license MIT */
  /**
   * Convert a string from camel case to dash-case
   * @param   {string} string - probably a component tag name
   * @returns {string} component name normalized
   */
  function camelToDashCase(string) {
    return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
  /**
   * Convert a string containing dashes to camel case
   * @param   {string} string - input string
   * @returns {string} my-string -> myString
   */

  function dashToCamelCase(string) {
    return string.replace(/-(\w)/g, (_, c) => c.toUpperCase());
  }

  /**
   * Get all the element attributes as object
   * @param   {HTMLElement} element - DOM node we want to parse
   * @returns {Object} all the attributes found as a key value pairs
   */

  function DOMattributesToObject(element) {
    return Array.from(element.attributes).reduce((acc, attribute) => {
      acc[dashToCamelCase(attribute.name)] = attribute.value;
      return acc;
    }, {});
  }
  /**
   * Move all the child nodes from a source tag to another
   * @param   {HTMLElement} source - source node
   * @param   {HTMLElement} target - target node
   * @returns {undefined} it's a void method ¯\_(ツ)_/¯
   */
  // Ignore this helper because it's needed only for svg tags

  function moveChildren(source, target) {
    if (source.firstChild) {
      target.appendChild(source.firstChild);
      moveChildren(source, target);
    }
  }
  /**
   * Remove the child nodes from any DOM node
   * @param   {HTMLElement} node - target node
   * @returns {undefined}
   */

  function cleanNode(node) {
    clearChildren(node.childNodes);
  }
  /**
   * Clear multiple children in a node
   * @param   {HTMLElement[]} children - direct children nodes
   * @returns {undefined}
   */

  function clearChildren(children) {
    Array.from(children).forEach(removeChild);
  }
  /**
   * Remove a node
   * @param {HTMLElement}node - node to remove
   * @returns {undefined}
   */

  const removeChild = node => node && node.parentNode && node.parentNode.removeChild(node);
  /**
   * Insert before a node
   * @param {HTMLElement} newNode - node to insert
   * @param {HTMLElement} refNode - ref child
   * @returns {undefined}
   */

  const insertBefore = (newNode, refNode) => refNode && refNode.parentNode && refNode.parentNode.insertBefore(newNode, refNode);
  /**
   * Replace a node
   * @param {HTMLElement} newNode - new node to add to the DOM
   * @param {HTMLElement} replaced - node to replace
   * @returns {undefined}
   */

  const replaceChild = (newNode, replaced) => replaced && replaced.parentNode && replaced.parentNode.replaceChild(newNode, replaced);

  // Riot.js constants that can be used accross more modules
  const COMPONENTS_IMPLEMENTATION_MAP = new Map(),
        DOM_COMPONENT_INSTANCE_PROPERTY = Symbol('riot-component'),
        PLUGINS_SET = new Set(),
        IS_DIRECTIVE = 'is',
        MOUNT_METHOD_KEY = 'mount',
        UPDATE_METHOD_KEY = 'update',
        UNMOUNT_METHOD_KEY = 'unmount',
        SHOULD_UPDATE_KEY = 'shouldUpdate',
        ON_BEFORE_MOUNT_KEY = 'onBeforeMount',
        ON_MOUNTED_KEY = 'onMounted',
        ON_BEFORE_UPDATE_KEY = 'onBeforeUpdate',
        ON_UPDATED_KEY = 'onUpdated',
        ON_BEFORE_UNMOUNT_KEY = 'onBeforeUnmount',
        ON_UNMOUNTED_KEY = 'onUnmounted',
        PROPS_KEY = 'props',
        STATE_KEY = 'state',
        SLOTS_KEY = 'slots',
        ROOT_KEY = 'root',
        IS_PURE_SYMBOL = Symbol.for('pure'),
        PARENT_KEY_SYMBOL = Symbol('parent'),
        ATTRIBUTES_KEY_SYMBOL = Symbol('attributes'),
        TEMPLATE_KEY_SYMBOL = Symbol('template');

  const EACH = 0;
  const IF = 1;
  const SIMPLE = 2;
  const TAG = 3;
  const SLOT = 4;
  var bindingTypes = {
    EACH,
    IF,
    SIMPLE,
    TAG,
    SLOT
  };

  const ATTRIBUTE = 0;
  const EVENT = 1;
  const TEXT = 2;
  const VALUE = 3;
  var expressionTypes = {
    ATTRIBUTE,
    EVENT,
    TEXT,
    VALUE
  };

  /**
   * Create the template meta object in case of <template> fragments
   * @param   {TemplateChunk} componentTemplate - template chunk object
   * @returns {Object} the meta property that will be passed to the mount function of the TemplateChunk
   */
  function createTemplateMeta(componentTemplate) {
    const fragment = componentTemplate.dom.cloneNode(true);
    return {
      avoidDOMInjection: true,
      fragment,
      children: Array.from(fragment.childNodes)
    };
  }

  /**
   * Quick type checking
   * @param   {*} element - anything
   * @param   {string} type - type definition
   * @returns {boolean} true if the type corresponds
   */
  function checkType(element, type) {
    return typeof element === type;
  }
  /**
   * Check if an element is part of an svg
   * @param   {HTMLElement}  el - element to check
   * @returns {boolean} true if we are in an svg context
   */

  function isSvg(el) {
    const owner = el.ownerSVGElement;
    return !!owner || owner === null;
  }
  /**
   * Check if an element is a template tag
   * @param   {HTMLElement}  el - element to check
   * @returns {boolean} true if it's a <template>
   */

  function isTemplate(el) {
    return !isNil(el.content);
  }
  /**
   * Check that will be passed if its argument is a function
   * @param   {*} value - value to check
   * @returns {boolean} - true if the value is a function
   */

  function isFunction(value) {
    return checkType(value, 'function');
  }
  /**
   * Check if a value is a Boolean
   * @param   {*}  value - anything
   * @returns {boolean} true only for the value is a boolean
   */

  function isBoolean(value) {
    return checkType(value, 'boolean');
  }
  /**
   * Check if a value is an Object
   * @param   {*}  value - anything
   * @returns {boolean} true only for the value is an object
   */

  function isObject(value) {
    return !isNil(value) && checkType(value, 'object');
  }
  /**
   * Check if a value is null or undefined
   * @param   {*}  value - anything
   * @returns {boolean} true only for the 'undefined' and 'null' types
   */

  function isNil(value) {
    return value === null || value === undefined;
  }

  /**
   * ISC License
   *
   * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
   * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
   * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
   * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
   * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
   * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
   * PERFORMANCE OF THIS SOFTWARE.
   */
  // fork of https://github.com/WebReflection/udomdiff version 1.1.0
  // due to https://github.com/WebReflection/udomdiff/pull/2

  /* eslint-disable */

  /**
   * @param {Node} parentNode The container where children live
   * @param {Node[]} a The list of current/live children
   * @param {Node[]} b The list of future children
   * @param {(entry: Node, action: number) => Node} get
   * The callback invoked per each entry related DOM operation.
   * @param {Node} [before] The optional node used as anchor to insert before.
   * @returns {Node[]} The same list of future children.
   */

  var udomdiff = ((parentNode, a, b, get, before) => {
    const bLength = b.length;
    let aEnd = a.length;
    let bEnd = bLength;
    let aStart = 0;
    let bStart = 0;
    let map = null;

    while (aStart < aEnd || bStart < bEnd) {
      // append head, tail, or nodes in between: fast path
      if (aEnd === aStart) {
        // we could be in a situation where the rest of nodes that
        // need to be added are not at the end, and in such case
        // the node to `insertBefore`, if the index is more than 0
        // must be retrieved, otherwise it's gonna be the first item.
        const node = bEnd < bLength ? bStart ? get(b[bStart - 1], -0).nextSibling : get(b[bEnd - bStart], 0) : before;

        while (bStart < bEnd) insertBefore(get(b[bStart++], 1), node);
      } // remove head or tail: fast path
      else if (bEnd === bStart) {
          while (aStart < aEnd) {
            // remove the node only if it's unknown or not live
            if (!map || !map.has(a[aStart])) removeChild(get(a[aStart], -1));
            aStart++;
          }
        } // same node: fast path
        else if (a[aStart] === b[bStart]) {
            aStart++;
            bStart++;
          } // same tail: fast path
          else if (a[aEnd - 1] === b[bEnd - 1]) {
              aEnd--;
              bEnd--;
            } // The once here single last swap "fast path" has been removed in v1.1.0
            // https://github.com/WebReflection/udomdiff/blob/single-final-swap/esm/index.js#L69-L85
            // reverse swap: also fast path
            else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
                // this is a "shrink" operation that could happen in these cases:
                // [1, 2, 3, 4, 5]
                // [1, 4, 3, 2, 5]
                // or asymmetric too
                // [1, 2, 3, 4, 5]
                // [1, 2, 3, 5, 6, 4]
                const node = get(a[--aEnd], -1).nextSibling;
                insertBefore(get(b[bStart++], 1), get(a[aStart++], -1).nextSibling);
                insertBefore(get(b[--bEnd], 1), node); // mark the future index as identical (yeah, it's dirty, but cheap 👍)
                // The main reason to do this, is that when a[aEnd] will be reached,
                // the loop will likely be on the fast path, as identical to b[bEnd].
                // In the best case scenario, the next loop will skip the tail,
                // but in the worst one, this node will be considered as already
                // processed, bailing out pretty quickly from the map index check

                a[aEnd] = b[bEnd];
              } // map based fallback, "slow" path
              else {
                  // the map requires an O(bEnd - bStart) operation once
                  // to store all future nodes indexes for later purposes.
                  // In the worst case scenario, this is a full O(N) cost,
                  // and such scenario happens at least when all nodes are different,
                  // but also if both first and last items of the lists are different
                  if (!map) {
                    map = new Map();
                    let i = bStart;

                    while (i < bEnd) map.set(b[i], i++);
                  } // if it's a future node, hence it needs some handling


                  if (map.has(a[aStart])) {
                    // grab the index of such node, 'cause it might have been processed
                    const index = map.get(a[aStart]); // if it's not already processed, look on demand for the next LCS

                    if (bStart < index && index < bEnd) {
                      let i = aStart; // counts the amount of nodes that are the same in the future

                      let sequence = 1;

                      while (++i < aEnd && i < bEnd && map.get(a[i]) === index + sequence) sequence++; // effort decision here: if the sequence is longer than replaces
                      // needed to reach such sequence, which would brings again this loop
                      // to the fast path, prepend the difference before a sequence,
                      // and move only the future list index forward, so that aStart
                      // and bStart will be aligned again, hence on the fast path.
                      // An example considering aStart and bStart are both 0:
                      // a: [1, 2, 3, 4]
                      // b: [7, 1, 2, 3, 6]
                      // this would place 7 before 1 and, from that time on, 1, 2, and 3
                      // will be processed at zero cost


                      if (sequence > index - bStart) {
                        const node = get(a[aStart], 0);

                        while (bStart < index) insertBefore(get(b[bStart++], 1), node);
                      } // if the effort wasn't good enough, fallback to a replace,
                      // moving both source and target indexes forward, hoping that some
                      // similar node will be found later on, to go back to the fast path
                      else {
                          replaceChild(get(b[bStart++], 1), get(a[aStart++], -1));
                        }
                    } // otherwise move the source forward, 'cause there's nothing to do
                    else aStart++;
                  } // this node has no meaning in the future list, so it's more than safe
                  // to remove it, and check the next live node out instead, meaning
                  // that only the live list index should be forwarded
                  else removeChild(get(a[aStart++], -1));
                }
    }

    return b;
  });

  const UNMOUNT_SCOPE = Symbol('unmount');
  const EachBinding = {
    // dynamic binding properties
    // childrenMap: null,
    // node: null,
    // root: null,
    // condition: null,
    // evaluate: null,
    // template: null,
    // isTemplateTag: false,
    nodes: [],

    // getKey: null,
    // indexName: null,
    // itemName: null,
    // afterPlaceholder: null,
    // placeholder: null,
    // API methods
    mount(scope, parentScope) {
      return this.update(scope, parentScope);
    },

    update(scope, parentScope) {
      const {
        placeholder,
        nodes,
        childrenMap
      } = this;
      const collection = scope === UNMOUNT_SCOPE ? null : this.evaluate(scope);
      const items = collection ? Array.from(collection) : [];
      const parent = placeholder.parentNode; // prepare the diffing

      const {
        newChildrenMap,
        batches,
        futureNodes
      } = createPatch(items, scope, parentScope, this); // patch the DOM only if there are new nodes

      udomdiff(parent, nodes, futureNodes, patch(Array.from(childrenMap.values()), parentScope), placeholder); // trigger the mounts and the updates

      batches.forEach(fn => fn()); // update the children map

      this.childrenMap = newChildrenMap;
      this.nodes = futureNodes;
      return this;
    },

    unmount(scope, parentScope) {
      this.update(UNMOUNT_SCOPE, parentScope);
      return this;
    }

  };
  /**
   * Patch the DOM while diffing
   * @param   {TemplateChunk[]} redundant - redundant tepmplate chunks
   * @param   {*} parentScope - scope of the parent template
   * @returns {Function} patch function used by domdiff
   */

  function patch(redundant, parentScope) {
    return (item, info) => {
      if (info < 0) {
        const element = redundant.pop();

        if (element) {
          const {
            template,
            context
          } = element; // notice that we pass null as last argument because
          // the root node and its children will be removed by domdiff

          template.unmount(context, parentScope, null);
        }
      }

      return item;
    };
  }
  /**
   * Check whether a template must be filtered from a loop
   * @param   {Function} condition - filter function
   * @param   {Object} context - argument passed to the filter function
   * @returns {boolean} true if this item should be skipped
   */


  function mustFilterItem(condition, context) {
    return condition ? Boolean(condition(context)) === false : false;
  }
  /**
   * Extend the scope of the looped template
   * @param   {Object} scope - current template scope
   * @param   {string} options.itemName - key to identify the looped item in the new context
   * @param   {string} options.indexName - key to identify the index of the looped item
   * @param   {number} options.index - current index
   * @param   {*} options.item - collection item looped
   * @returns {Object} enhanced scope object
   */


  function extendScope(scope, _ref) {
    let {
      itemName,
      indexName,
      index,
      item
    } = _ref;
    scope[itemName] = item;
    if (indexName) scope[indexName] = index;
    return scope;
  }
  /**
   * Loop the current template items
   * @param   {Array} items - expression collection value
   * @param   {*} scope - template scope
   * @param   {*} parentScope - scope of the parent template
   * @param   {EeachBinding} binding - each binding object instance
   * @returns {Object} data
   * @returns {Map} data.newChildrenMap - a Map containing the new children template structure
   * @returns {Array} data.batches - array containing the template lifecycle functions to trigger
   * @returns {Array} data.futureNodes - array containing the nodes we need to diff
   */


  function createPatch(items, scope, parentScope, binding) {
    const {
      condition,
      template,
      childrenMap,
      itemName,
      getKey,
      indexName,
      root,
      isTemplateTag
    } = binding;
    const newChildrenMap = new Map();
    const batches = [];
    const futureNodes = [];
    items.forEach((item, index) => {
      const context = extendScope(Object.create(scope), {
        itemName,
        indexName,
        index,
        item
      });
      const key = getKey ? getKey(context) : index;
      const oldItem = childrenMap.get(key);

      if (mustFilterItem(condition, context)) {
        return;
      }

      const componentTemplate = oldItem ? oldItem.template : template.clone();
      const el = oldItem ? componentTemplate.el : root.cloneNode();
      const mustMount = !oldItem;
      const meta = isTemplateTag && mustMount ? createTemplateMeta(componentTemplate) : {};

      if (mustMount) {
        batches.push(() => componentTemplate.mount(el, context, parentScope, meta));
      } else {
        batches.push(() => componentTemplate.update(context, parentScope));
      } // create the collection of nodes to update or to add
      // in case of template tags we need to add all its children nodes


      if (isTemplateTag) {
        const children = meta.children || componentTemplate.children;
        futureNodes.push(...children);
      } else {
        futureNodes.push(el);
      } // delete the old item from the children map


      childrenMap.delete(key); // update the children map

      newChildrenMap.set(key, {
        template: componentTemplate,
        context,
        index
      });
    });
    return {
      newChildrenMap,
      batches,
      futureNodes
    };
  }

  function create(node, _ref2) {
    let {
      evaluate,
      condition,
      itemName,
      indexName,
      getKey,
      template
    } = _ref2;
    const placeholder = document.createTextNode('');
    const root = node.cloneNode();
    insertBefore(placeholder, node);
    removeChild(node);
    return Object.assign({}, EachBinding, {
      childrenMap: new Map(),
      node,
      root,
      condition,
      evaluate,
      isTemplateTag: isTemplate(root),
      template: template.createDOM(node),
      getKey,
      indexName,
      itemName,
      placeholder
    });
  }

  /**
   * Binding responsible for the `if` directive
   */

  const IfBinding = {
    // dynamic binding properties
    // node: null,
    // evaluate: null,
    // isTemplateTag: false,
    // placeholder: null,
    // template: null,
    // API methods
    mount(scope, parentScope) {
      return this.update(scope, parentScope);
    },

    update(scope, parentScope) {
      const value = !!this.evaluate(scope);
      const mustMount = !this.value && value;
      const mustUnmount = this.value && !value;

      const mount = () => {
        const pristine = this.node.cloneNode();
        insertBefore(pristine, this.placeholder);
        this.template = this.template.clone();
        this.template.mount(pristine, scope, parentScope);
      };

      switch (true) {
        case mustMount:
          mount();
          break;

        case mustUnmount:
          this.unmount(scope);
          break;

        default:
          if (value) this.template.update(scope, parentScope);
      }

      this.value = value;
      return this;
    },

    unmount(scope, parentScope) {
      this.template.unmount(scope, parentScope, true);
      return this;
    }

  };
  function create$1(node, _ref) {
    let {
      evaluate,
      template
    } = _ref;
    const placeholder = document.createTextNode('');
    insertBefore(placeholder, node);
    removeChild(node);
    return Object.assign({}, IfBinding, {
      node,
      evaluate,
      placeholder,
      template: template.createDOM(node)
    });
  }

  /**
   * Throw an error with a descriptive message
   * @param   { string } message - error message
   * @returns { undefined } hoppla.. at this point the program should stop working
   */

  function panic(message) {
    throw new Error(message);
  }
  /**
   * Returns the memoized (cached) function.
   * // borrowed from https://www.30secondsofcode.org/js/s/memoize
   * @param {Function} fn - function to memoize
   * @returns {Function} memoize function
   */

  function memoize(fn) {
    const cache = new Map();

    const cached = val => {
      return cache.has(val) ? cache.get(val) : cache.set(val, fn.call(this, val)) && cache.get(val);
    };

    cached.cache = cache;
    return cached;
  }
  /**
   * Evaluate a list of attribute expressions
   * @param   {Array} attributes - attribute expressions generated by the riot compiler
   * @returns {Object} key value pairs with the result of the computation
   */

  function evaluateAttributeExpressions(attributes) {
    return attributes.reduce((acc, attribute) => {
      const {
        value,
        type
      } = attribute;

      switch (true) {
        // spread attribute
        case !attribute.name && type === ATTRIBUTE:
          return Object.assign({}, acc, value);
        // value attribute

        case type === VALUE:
          acc.value = attribute.value;
          break;
        // normal attributes

        default:
          acc[dashToCamelCase(attribute.name)] = attribute.value;
      }

      return acc;
    }, {});
  }

  const REMOVE_ATTRIBUTE = 'removeAttribute';
  const SET_ATTIBUTE = 'setAttribute';
  const ElementProto = typeof Element === 'undefined' ? {} : Element.prototype;
  const isNativeHtmlProperty = memoize(name => ElementProto.hasOwnProperty(name)); // eslint-disable-line

  /**
   * Add all the attributes provided
   * @param   {HTMLElement} node - target node
   * @param   {Object} attributes - object containing the attributes names and values
   * @returns {undefined} sorry it's a void function :(
   */

  function setAllAttributes(node, attributes) {
    Object.entries(attributes).forEach((_ref) => {
      let [name, value] = _ref;
      return attributeExpression(node, {
        name
      }, value);
    });
  }
  /**
   * Remove all the attributes provided
   * @param   {HTMLElement} node - target node
   * @param   {Object} newAttributes - object containing all the new attribute names
   * @param   {Object} oldAttributes - object containing all the old attribute names
   * @returns {undefined} sorry it's a void function :(
   */


  function removeAllAttributes(node, newAttributes, oldAttributes) {
    const newKeys = newAttributes ? Object.keys(newAttributes) : [];
    Object.keys(oldAttributes).filter(name => !newKeys.includes(name)).forEach(attribute => node.removeAttribute(attribute));
  }
  /**
   * This methods handles the DOM attributes updates
   * @param   {HTMLElement} node - target node
   * @param   {Object} expression - expression object
   * @param   {string} expression.name - attribute name
   * @param   {*} value - new expression value
   * @param   {*} oldValue - the old expression cached value
   * @returns {undefined}
   */


  function attributeExpression(node, _ref2, value, oldValue) {
    let {
      name
    } = _ref2;

    // is it a spread operator? {...attributes}
    if (!name) {
      if (oldValue) {
        // remove all the old attributes
        removeAllAttributes(node, value, oldValue);
      } // is the value still truthy?


      if (value) {
        setAllAttributes(node, value);
      }

      return;
    } // handle boolean attributes


    if (!isNativeHtmlProperty(name) && (isBoolean(value) || isObject(value) || isFunction(value))) {
      node[name] = value;
    }

    node[getMethod(value)](name, normalizeValue(name, value));
  }
  /**
   * Get the attribute modifier method
   * @param   {*} value - if truthy we return `setAttribute` othewise `removeAttribute`
   * @returns {string} the node attribute modifier method name
   */

  function getMethod(value) {
    return isNil(value) || value === false || value === '' || isObject(value) || isFunction(value) ? REMOVE_ATTRIBUTE : SET_ATTIBUTE;
  }
  /**
   * Get the value as string
   * @param   {string} name - attribute name
   * @param   {*} value - user input value
   * @returns {string} input value as string
   */


  function normalizeValue(name, value) {
    // be sure that expressions like selected={ true } will be always rendered as selected='selected'
    if (value === true) return name;
    return value;
  }

  const RE_EVENTS_PREFIX = /^on/;

  const getCallbackAndOptions = value => Array.isArray(value) ? value : [value, false]; // see also https://medium.com/@WebReflection/dom-handleevent-a-cross-platform-standard-since-year-2000-5bf17287fd38


  const EventListener = {
    handleEvent(event) {
      this[event.type](event);
    }

  };
  const ListenersWeakMap = new WeakMap();

  const createListener = node => {
    const listener = Object.create(EventListener);
    ListenersWeakMap.set(node, listener);
    return listener;
  };
  /**
   * Set a new event listener
   * @param   {HTMLElement} node - target node
   * @param   {Object} expression - expression object
   * @param   {string} expression.name - event name
   * @param   {*} value - new expression value
   * @returns {value} the callback just received
   */


  function eventExpression(node, _ref, value) {
    let {
      name
    } = _ref;
    const normalizedEventName = name.replace(RE_EVENTS_PREFIX, '');
    const eventListener = ListenersWeakMap.get(node) || createListener(node);
    const [callback, options] = getCallbackAndOptions(value);
    const handler = eventListener[normalizedEventName];
    const mustRemoveEvent = handler && !callback;
    const mustAddEvent = callback && !handler;

    if (mustRemoveEvent) {
      node.removeEventListener(normalizedEventName, eventListener);
    }

    if (mustAddEvent) {
      node.addEventListener(normalizedEventName, eventListener, options);
    }

    eventListener[normalizedEventName] = callback;
  }

  /**
   * Normalize the user value in order to render a empty string in case of falsy values
   * @param   {*} value - user input value
   * @returns {string} hopefully a string
   */

  function normalizeStringValue(value) {
    return isNil(value) ? '' : value;
  }

  /**
   * Get the the target text node to update or create one from of a comment node
   * @param   {HTMLElement} node - any html element containing childNodes
   * @param   {number} childNodeIndex - index of the text node in the childNodes list
   * @returns {HTMLTextNode} the text node to update
   */

  const getTextNode = (node, childNodeIndex) => {
    const target = node.childNodes[childNodeIndex];

    if (target.nodeType === Node.COMMENT_NODE) {
      const textNode = document.createTextNode('');
      node.replaceChild(textNode, target);
      return textNode;
    }

    return target;
  };
  /**
   * This methods handles a simple text expression update
   * @param   {HTMLElement} node - target node
   * @param   {Object} data - expression object
   * @param   {*} value - new expression value
   * @returns {undefined}
   */

  function textExpression(node, data, value) {
    node.data = normalizeStringValue(value);
  }

  /**
   * This methods handles the input fileds value updates
   * @param   {HTMLElement} node - target node
   * @param   {Object} expression - expression object
   * @param   {*} value - new expression value
   * @returns {undefined}
   */

  function valueExpression(node, expression, value) {
    node.value = normalizeStringValue(value);
  }

  var expressions = {
    [ATTRIBUTE]: attributeExpression,
    [EVENT]: eventExpression,
    [TEXT]: textExpression,
    [VALUE]: valueExpression
  };

  const Expression = {
    // Static props
    // node: null,
    // value: null,
    // API methods

    /**
     * Mount the expression evaluating its initial value
     * @param   {*} scope - argument passed to the expression to evaluate its current values
     * @returns {Expression} self
     */
    mount(scope) {
      // hopefully a pure function
      this.value = this.evaluate(scope); // IO() DOM updates

      apply(this, this.value);
      return this;
    },

    /**
     * Update the expression if its value changed
     * @param   {*} scope - argument passed to the expression to evaluate its current values
     * @returns {Expression} self
     */
    update(scope) {
      // pure function
      const value = this.evaluate(scope);

      if (this.value !== value) {
        // IO() DOM updates
        apply(this, value);
        this.value = value;
      }

      return this;
    },

    /**
     * Expression teardown method
     * @returns {Expression} self
     */
    unmount() {
      // unmount only the event handling expressions
      if (this.type === EVENT) apply(this, null);
      return this;
    }

  };
  /**
   * IO() function to handle the DOM updates
   * @param {Expression} expression - expression object
   * @param {*} value - current expression value
   * @returns {undefined}
   */

  function apply(expression, value) {
    return expressions[expression.type](expression.node, expression, value, expression.value);
  }

  function create$2(node, data) {
    return Object.assign({}, Expression, data, {
      node: data.type === TEXT ? getTextNode(node, data.childNodeIndex) : node
    });
  }

  /**
   * Create a flat object having as keys a list of methods that if dispatched will propagate
   * on the whole collection
   * @param   {Array} collection - collection to iterate
   * @param   {Array<string>} methods - methods to execute on each item of the collection
   * @param   {*} context - context returned by the new methods created
   * @returns {Object} a new object to simplify the the nested methods dispatching
   */
  function flattenCollectionMethods(collection, methods, context) {
    return methods.reduce((acc, method) => {
      return Object.assign({}, acc, {
        [method]: scope => {
          return collection.map(item => item[method](scope)) && context;
        }
      });
    }, {});
  }

  function create$3(node, _ref) {
    let {
      expressions
    } = _ref;
    return Object.assign({}, flattenCollectionMethods(expressions.map(expression => create$2(node, expression)), ['mount', 'update', 'unmount']));
  }

  function extendParentScope(attributes, scope, parentScope) {
    if (!attributes || !attributes.length) return parentScope;
    const expressions = attributes.map(attr => Object.assign({}, attr, {
      value: attr.evaluate(scope)
    }));
    return Object.assign(Object.create(parentScope || null), evaluateAttributeExpressions(expressions));
  } // this function is only meant to fix an edge case
  // https://github.com/riot/riot/issues/2842


  const getRealParent = (scope, parentScope) => scope[PARENT_KEY_SYMBOL] || parentScope;

  const SlotBinding = {
    // dynamic binding properties
    // node: null,
    // name: null,
    attributes: [],

    // template: null,
    getTemplateScope(scope, parentScope) {
      return extendParentScope(this.attributes, scope, parentScope);
    },

    // API methods
    mount(scope, parentScope) {
      const templateData = scope.slots ? scope.slots.find((_ref) => {
        let {
          id
        } = _ref;
        return id === this.name;
      }) : false;
      const {
        parentNode
      } = this.node;
      const realParent = getRealParent(scope, parentScope);
      this.template = templateData && create$6(templateData.html, templateData.bindings).createDOM(parentNode);

      if (this.template) {
        this.template.mount(this.node, this.getTemplateScope(scope, realParent), realParent);
        this.template.children = Array.from(this.node.childNodes);
        moveSlotInnerContent(this.node);
      }

      removeChild(this.node);
      return this;
    },

    update(scope, parentScope) {
      if (this.template) {
        const realParent = getRealParent(scope, parentScope);
        this.template.update(this.getTemplateScope(scope, realParent), realParent);
      }

      return this;
    },

    unmount(scope, parentScope, mustRemoveRoot) {
      if (this.template) {
        this.template.unmount(this.getTemplateScope(scope, parentScope), null, mustRemoveRoot);
      }

      return this;
    }

  };
  /**
   * Move the inner content of the slots outside of them
   * @param   {HTMLElement} slot - slot node
   * @returns {undefined} it's a void method ¯\_(ツ)_/¯
   */

  function moveSlotInnerContent(slot) {
    const child = slot && slot.firstChild;
    if (!child) return;
    insertBefore(child, slot);
    moveSlotInnerContent(slot);
  }
  /**
   * Create a single slot binding
   * @param   {HTMLElement} node - slot node
   * @param   {string} options.name - slot id
   * @returns {Object} Slot binding object
   */


  function createSlot(node, _ref2) {
    let {
      name,
      attributes
    } = _ref2;
    return Object.assign({}, SlotBinding, {
      attributes,
      node,
      name
    });
  }

  /**
   * Create a new tag object if it was registered before, otherwise fallback to the simple
   * template chunk
   * @param   {Function} component - component factory function
   * @param   {Array<Object>} slots - array containing the slots markup
   * @param   {Array} attributes - dynamic attributes that will be received by the tag element
   * @returns {TagImplementation|TemplateChunk} a tag implementation or a template chunk as fallback
   */

  function getTag(component, slots, attributes) {
    if (slots === void 0) {
      slots = [];
    }

    if (attributes === void 0) {
      attributes = [];
    }

    // if this tag was registered before we will return its implementation
    if (component) {
      return component({
        slots,
        attributes
      });
    } // otherwise we return a template chunk


    return create$6(slotsToMarkup(slots), [...slotBindings(slots), {
      // the attributes should be registered as binding
      // if we fallback to a normal template chunk
      expressions: attributes.map(attr => {
        return Object.assign({
          type: ATTRIBUTE
        }, attr);
      })
    }]);
  }
  /**
   * Merge all the slots bindings into a single array
   * @param   {Array<Object>} slots - slots collection
   * @returns {Array<Bindings>} flatten bindings array
   */


  function slotBindings(slots) {
    return slots.reduce((acc, _ref) => {
      let {
        bindings
      } = _ref;
      return acc.concat(bindings);
    }, []);
  }
  /**
   * Merge all the slots together in a single markup string
   * @param   {Array<Object>} slots - slots collection
   * @returns {string} markup of all the slots in a single string
   */


  function slotsToMarkup(slots) {
    return slots.reduce((acc, slot) => {
      return acc + slot.html;
    }, '');
  }

  const TagBinding = {
    // dynamic binding properties
    // node: null,
    // evaluate: null,
    // name: null,
    // slots: null,
    // tag: null,
    // attributes: null,
    // getComponent: null,
    mount(scope) {
      return this.update(scope);
    },

    update(scope, parentScope) {
      const name = this.evaluate(scope); // simple update

      if (name === this.name) {
        this.tag.update(scope);
      } else {
        // unmount the old tag if it exists
        this.unmount(scope, parentScope, true); // mount the new tag

        this.name = name;
        this.tag = getTag(this.getComponent(name), this.slots, this.attributes);
        this.tag.mount(this.node, scope);
      }

      return this;
    },

    unmount(scope, parentScope, keepRootTag) {
      if (this.tag) {
        // keep the root tag
        this.tag.unmount(keepRootTag);
      }

      return this;
    }

  };
  function create$4(node, _ref2) {
    let {
      evaluate,
      getComponent,
      slots,
      attributes
    } = _ref2;
    return Object.assign({}, TagBinding, {
      node,
      evaluate,
      slots,
      attributes,
      getComponent
    });
  }

  var bindings = {
    [IF]: create$1,
    [SIMPLE]: create$3,
    [EACH]: create,
    [TAG]: create$4,
    [SLOT]: createSlot
  };

  /**
   * Text expressions in a template tag will get childNodeIndex value normalized
   * depending on the position of the <template> tag offset
   * @param   {Expression[]} expressions - riot expressions array
   * @param   {number} textExpressionsOffset - offset of the <template> tag
   * @returns {Expression[]} expressions containing the text expressions normalized
   */

  function fixTextExpressionsOffset(expressions, textExpressionsOffset) {
    return expressions.map(e => e.type === TEXT ? Object.assign({}, e, {
      childNodeIndex: e.childNodeIndex + textExpressionsOffset
    }) : e);
  }
  /**
   * Bind a new expression object to a DOM node
   * @param   {HTMLElement} root - DOM node where to bind the expression
   * @param   {Object} binding - binding data
   * @param   {number|null} templateTagOffset - if it's defined we need to fix the text expressions childNodeIndex offset
   * @returns {Binding} Binding object
   */


  function create$5(root, binding, templateTagOffset) {
    const {
      selector,
      type,
      redundantAttribute,
      expressions
    } = binding; // find the node to apply the bindings

    const node = selector ? root.querySelector(selector) : root; // remove eventually additional attributes created only to select this node

    if (redundantAttribute) node.removeAttribute(redundantAttribute);
    const bindingExpressions = expressions || []; // init the binding

    return (bindings[type] || bindings[SIMPLE])(node, Object.assign({}, binding, {
      expressions: templateTagOffset && !selector ? fixTextExpressionsOffset(bindingExpressions, templateTagOffset) : bindingExpressions
    }));
  }

  function createHTMLTree(html, root) {
    const template = isTemplate(root) ? root : document.createElement('template');
    template.innerHTML = html;
    return template.content;
  } // for svg nodes we need a bit more work


  function createSVGTree(html, container) {
    // create the SVGNode
    const svgNode = container.ownerDocument.importNode(new window.DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`, 'application/xml').documentElement, true);
    return svgNode;
  }
  /**
   * Create the DOM that will be injected
   * @param {Object} root - DOM node to find out the context where the fragment will be created
   * @param   {string} html - DOM to create as string
   * @returns {HTMLDocumentFragment|HTMLElement} a new html fragment
   */


  function createDOMTree(root, html) {
    if (isSvg(root)) return createSVGTree(html, root);
    return createHTMLTree(html, root);
  }

  /**
   * Inject the DOM tree into a target node
   * @param   {HTMLElement} el - target element
   * @param   {HTMLFragment|SVGElement} dom - dom tree to inject
   * @returns {undefined}
   */

  function injectDOM(el, dom) {
    switch (true) {
      case isSvg(el):
        moveChildren(dom, el);
        break;

      case isTemplate(el):
        el.parentNode.replaceChild(dom, el);
        break;

      default:
        el.appendChild(dom);
    }
  }

  /**
   * Create the Template DOM skeleton
   * @param   {HTMLElement} el - root node where the DOM will be injected
   * @param   {string} html - markup that will be injected into the root node
   * @returns {HTMLFragment} fragment that will be injected into the root node
   */

  function createTemplateDOM(el, html) {
    return html && (typeof html === 'string' ? createDOMTree(el, html) : html);
  }
  /**
   * Template Chunk model
   * @type {Object}
   */


  const TemplateChunk = Object.freeze({
    // Static props
    // bindings: null,
    // bindingsData: null,
    // html: null,
    // isTemplateTag: false,
    // fragment: null,
    // children: null,
    // dom: null,
    // el: null,

    /**
     * Create the template DOM structure that will be cloned on each mount
     * @param   {HTMLElement} el - the root node
     * @returns {TemplateChunk} self
     */
    createDOM(el) {
      // make sure that the DOM gets created before cloning the template
      this.dom = this.dom || createTemplateDOM(el, this.html);
      return this;
    },

    // API methods

    /**
     * Attach the template to a DOM node
     * @param   {HTMLElement} el - target DOM node
     * @param   {*} scope - template data
     * @param   {*} parentScope - scope of the parent template tag
     * @param   {Object} meta - meta properties needed to handle the <template> tags in loops
     * @returns {TemplateChunk} self
     */
    mount(el, scope, parentScope, meta) {
      if (meta === void 0) {
        meta = {};
      }

      if (!el) throw new Error('Please provide DOM node to mount properly your template');
      if (this.el) this.unmount(scope); // <template> tags require a bit more work
      // the template fragment might be already created via meta outside of this call

      const {
        fragment,
        children,
        avoidDOMInjection
      } = meta; // <template> bindings of course can not have a root element
      // so we check the parent node to set the query selector bindings

      const {
        parentNode
      } = children ? children[0] : el;
      const isTemplateTag = isTemplate(el);
      const templateTagOffset = isTemplateTag ? Math.max(Array.from(parentNode.childNodes).indexOf(el), 0) : null;
      this.isTemplateTag = isTemplateTag; // create the DOM if it wasn't created before

      this.createDOM(el);

      if (this.dom) {
        // create the new template dom fragment if it want already passed in via meta
        this.fragment = fragment || this.dom.cloneNode(true);
      } // store root node
      // notice that for template tags the root note will be the parent tag


      this.el = this.isTemplateTag ? parentNode : el; // create the children array only for the <template> fragments

      this.children = this.isTemplateTag ? children || Array.from(this.fragment.childNodes) : null; // inject the DOM into the el only if a fragment is available

      if (!avoidDOMInjection && this.fragment) injectDOM(el, this.fragment); // create the bindings

      this.bindings = this.bindingsData.map(binding => create$5(this.el, binding, templateTagOffset));
      this.bindings.forEach(b => b.mount(scope, parentScope));
      return this;
    },

    /**
     * Update the template with fresh data
     * @param   {*} scope - template data
     * @param   {*} parentScope - scope of the parent template tag
     * @returns {TemplateChunk} self
     */
    update(scope, parentScope) {
      this.bindings.forEach(b => b.update(scope, parentScope));
      return this;
    },

    /**
     * Remove the template from the node where it was initially mounted
     * @param   {*} scope - template data
     * @param   {*} parentScope - scope of the parent template tag
     * @param   {boolean|null} mustRemoveRoot - if true remove the root element,
     * if false or undefined clean the root tag content, if null don't touch the DOM
     * @returns {TemplateChunk} self
     */
    unmount(scope, parentScope, mustRemoveRoot) {
      if (this.el) {
        this.bindings.forEach(b => b.unmount(scope, parentScope, mustRemoveRoot));

        switch (true) {
          // pure components should handle the DOM unmount updates by themselves
          case this.el[IS_PURE_SYMBOL]:
            break;
          // <template> tags should be treated a bit differently
          // we need to clear their children only if it's explicitly required by the caller
          // via mustRemoveRoot !== null

          case this.children && mustRemoveRoot !== null:
            clearChildren(this.children);
            break;
          // remove the root node only if the mustRemoveRoot === true

          case mustRemoveRoot === true:
            removeChild(this.el);
            break;
          // otherwise we clean the node children

          case mustRemoveRoot !== null:
            cleanNode(this.el);
            break;
        }

        this.el = null;
      }

      return this;
    },

    /**
     * Clone the template chunk
     * @returns {TemplateChunk} a clone of this object resetting the this.el property
     */
    clone() {
      return Object.assign({}, this, {
        el: null
      });
    }

  });
  /**
   * Create a template chunk wiring also the bindings
   * @param   {string|HTMLElement} html - template string
   * @param   {Array} bindings - bindings collection
   * @returns {TemplateChunk} a new TemplateChunk copy
   */

  function create$6(html, bindings) {
    if (bindings === void 0) {
      bindings = [];
    }

    return Object.assign({}, TemplateChunk, {
      html,
      bindingsData: bindings
    });
  }

  function noop() {
    return this;
  }
  /**
   * Autobind the methods of a source object to itself
   * @param   {Object} source - probably a riot tag instance
   * @param   {Array<string>} methods - list of the methods to autobind
   * @returns {Object} the original object received
   */

  function autobindMethods(source, methods) {
    methods.forEach(method => {
      source[method] = source[method].bind(source);
    });
    return source;
  }
  /**
   * Call the first argument received only if it's a function otherwise return it as it is
   * @param   {*} source - anything
   * @returns {*} anything
   */

  function callOrAssign(source) {
    return isFunction(source) ? source.prototype && source.prototype.constructor ? new source() : source() : source;
  }

  /**
   * Helper function to set an immutable property
   * @param   {Object} source - object where the new property will be set
   * @param   {string} key - object key where the new property will be stored
   * @param   {*} value - value of the new property
   * @param   {Object} options - set the propery overriding the default options
   * @returns {Object} - the original object modified
   */
  function defineProperty(source, key, value, options) {
    if (options === void 0) {
      options = {};
    }

    /* eslint-disable fp/no-mutating-methods */
    Object.defineProperty(source, key, Object.assign({
      value,
      enumerable: false,
      writable: false,
      configurable: true
    }, options));
    /* eslint-enable fp/no-mutating-methods */

    return source;
  }
  /**
   * Define multiple properties on a target object
   * @param   {Object} source - object where the new properties will be set
   * @param   {Object} properties - object containing as key pair the key + value properties
   * @param   {Object} options - set the propery overriding the default options
   * @returns {Object} the original object modified
   */

  function defineProperties(source, properties, options) {
    Object.entries(properties).forEach((_ref) => {
      let [key, value] = _ref;
      defineProperty(source, key, value, options);
    });
    return source;
  }
  /**
   * Define default properties if they don't exist on the source object
   * @param   {Object} source - object that will receive the default properties
   * @param   {Object} defaults - object containing additional optional keys
   * @returns {Object} the original object received enhanced
   */

  function defineDefaults(source, defaults) {
    Object.entries(defaults).forEach((_ref2) => {
      let [key, value] = _ref2;
      if (!source[key]) source[key] = value;
    });
    return source;
  }

  /**
   * Converts any DOM node/s to a loopable array
   * @param   { HTMLElement|NodeList } els - single html element or a node list
   * @returns { Array } always a loopable object
   */
  function domToArray(els) {
    // can this object be already looped?
    if (!Array.isArray(els)) {
      // is it a node list?
      if (/^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(els)) && typeof els.length === 'number') return Array.from(els);else // if it's a single node
        // it will be returned as "array" with one single entry
        return [els];
    } // this object could be looped out of the box


    return els;
  }

  /**
   * Simple helper to find DOM nodes returning them as array like loopable object
   * @param   { string|DOMNodeList } selector - either the query or the DOM nodes to arraify
   * @param   { HTMLElement }        ctx      - context defining where the query will search for the DOM nodes
   * @returns { Array } DOM nodes found as array
   */

  function $(selector, ctx) {
    return domToArray(typeof selector === 'string' ? (ctx || document).querySelectorAll(selector) : selector);
  }

  /**
   * Normalize the return values, in case of a single value we avoid to return an array
   * @param   { Array } values - list of values we want to return
   * @returns { Array|string|boolean } either the whole list of values or the single one found
   * @private
   */

  const normalize = values => values.length === 1 ? values[0] : values;
  /**
   * Parse all the nodes received to get/remove/check their attributes
   * @param   { HTMLElement|NodeList|Array } els    - DOM node/s to parse
   * @param   { string|Array }               name   - name or list of attributes
   * @param   { string }                     method - method that will be used to parse the attributes
   * @returns { Array|string } result of the parsing in a list or a single value
   * @private
   */


  function parseNodes(els, name, method) {
    const names = typeof name === 'string' ? [name] : name;
    return normalize(domToArray(els).map(el => {
      return normalize(names.map(n => el[method](n)));
    }));
  }
  /**
   * Set any attribute on a single or a list of DOM nodes
   * @param   { HTMLElement|NodeList|Array } els   - DOM node/s to parse
   * @param   { string|Object }              name  - either the name of the attribute to set
   *                                                 or a list of properties as object key - value
   * @param   { string }                     value - the new value of the attribute (optional)
   * @returns { HTMLElement|NodeList|Array } the original array of elements passed to this function
   *
   * @example
   *
   * import { set } from 'bianco.attr'
   *
   * const img = document.createElement('img')
   *
   * set(img, 'width', 100)
   *
   * // or also
   * set(img, {
   *   width: 300,
   *   height: 300
   * })
   *
   */


  function set(els, name, value) {
    const attrs = typeof name === 'object' ? name : {
      [name]: value
    };
    const props = Object.keys(attrs);
    domToArray(els).forEach(el => {
      props.forEach(prop => el.setAttribute(prop, attrs[prop]));
    });
    return els;
  }
  /**
   * Get any attribute from a single or a list of DOM nodes
   * @param   { HTMLElement|NodeList|Array } els   - DOM node/s to parse
   * @param   { string|Array }               name  - name or list of attributes to get
   * @returns { Array|string } list of the attributes found
   *
   * @example
   *
   * import { get } from 'bianco.attr'
   *
   * const img = document.createElement('img')
   *
   * get(img, 'width') // => '200'
   *
   * // or also
   * get(img, ['width', 'height']) // => ['200', '300']
   *
   * // or also
   * get([img1, img2], ['width', 'height']) // => [['200', '300'], ['500', '200']]
   */

  function get(els, name) {
    return parseNodes(els, name, 'getAttribute');
  }

  const CSS_BY_NAME = new Map();
  const STYLE_NODE_SELECTOR = 'style[riot]'; // memoized curried function

  const getStyleNode = (style => {
    return () => {
      // lazy evaluation:
      // if this function was already called before
      // we return its cached result
      if (style) return style; // create a new style element or use an existing one
      // and cache it internally

      style = $(STYLE_NODE_SELECTOR)[0] || document.createElement('style');
      set(style, 'type', 'text/css');
      /* istanbul ignore next */

      if (!style.parentNode) document.head.appendChild(style);
      return style;
    };
  })();
  /**
   * Object that will be used to inject and manage the css of every tag instance
   */


  var cssManager = {
    CSS_BY_NAME,

    /**
     * Save a tag style to be later injected into DOM
     * @param { string } name - if it's passed we will map the css to a tagname
     * @param { string } css - css string
     * @returns {Object} self
     */
    add(name, css) {
      if (!CSS_BY_NAME.has(name)) {
        CSS_BY_NAME.set(name, css);
        this.inject();
      }

      return this;
    },

    /**
     * Inject all previously saved tag styles into DOM
     * innerHTML seems slow: http://jsperf.com/riot-insert-style
     * @returns {Object} self
     */
    inject() {
      getStyleNode().innerHTML = [...CSS_BY_NAME.values()].join('\n');
      return this;
    },

    /**
     * Remove a tag style from the DOM
     * @param {string} name a registered tagname
     * @returns {Object} self
     */
    remove(name) {
      if (CSS_BY_NAME.has(name)) {
        CSS_BY_NAME.delete(name);
        this.inject();
      }

      return this;
    }

  };

  /**
   * Function to curry any javascript method
   * @param   {Function}  fn - the target function we want to curry
   * @param   {...[args]} acc - initial arguments
   * @returns {Function|*} it will return a function until the target function
   *                       will receive all of its arguments
   */
  function curry(fn) {
    for (var _len = arguments.length, acc = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      acc[_key - 1] = arguments[_key];
    }

    return function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      args = [...acc, ...args];
      return args.length < fn.length ? curry(fn, ...args) : fn(...args);
    };
  }

  /**
   * Get the tag name of any DOM node
   * @param   {HTMLElement} element - DOM node we want to inspect
   * @returns {string} name to identify this dom node in riot
   */

  function getName(element) {
    return get(element, IS_DIRECTIVE) || element.tagName.toLowerCase();
  }

  const COMPONENT_CORE_HELPERS = Object.freeze({
    // component helpers
    $(selector) {
      return $(selector, this.root)[0];
    },

    $$(selector) {
      return $(selector, this.root);
    }

  });
  const PURE_COMPONENT_API = Object.freeze({
    [MOUNT_METHOD_KEY]: noop,
    [UPDATE_METHOD_KEY]: noop,
    [UNMOUNT_METHOD_KEY]: noop
  });
  const COMPONENT_LIFECYCLE_METHODS = Object.freeze({
    [SHOULD_UPDATE_KEY]: noop,
    [ON_BEFORE_MOUNT_KEY]: noop,
    [ON_MOUNTED_KEY]: noop,
    [ON_BEFORE_UPDATE_KEY]: noop,
    [ON_UPDATED_KEY]: noop,
    [ON_BEFORE_UNMOUNT_KEY]: noop,
    [ON_UNMOUNTED_KEY]: noop
  });
  const MOCKED_TEMPLATE_INTERFACE = Object.assign({}, PURE_COMPONENT_API, {
    clone: noop,
    createDOM: noop
  });
  /**
   * Evaluate the component properties either from its real attributes or from its initial user properties
   * @param   {HTMLElement} element - component root
   * @param   {Object}  initialProps - initial props
   * @returns {Object} component props key value pairs
   */

  function evaluateInitialProps(element, initialProps) {
    if (initialProps === void 0) {
      initialProps = {};
    }

    return Object.assign({}, DOMattributesToObject(element), callOrAssign(initialProps));
  }
  /**
   * Bind a DOM node to its component object
   * @param   {HTMLElement} node - html node mounted
   * @param   {Object} component - Riot.js component object
   * @returns {Object} the component object received as second argument
   */


  const bindDOMNodeToComponentObject = (node, component) => node[DOM_COMPONENT_INSTANCE_PROPERTY] = component;
  /**
   * Wrap the Riot.js core API methods using a mapping function
   * @param   {Function} mapFunction - lifting function
   * @returns {Object} an object having the { mount, update, unmount } functions
   */


  function createCoreAPIMethods(mapFunction) {
    return [MOUNT_METHOD_KEY, UPDATE_METHOD_KEY, UNMOUNT_METHOD_KEY].reduce((acc, method) => {
      acc[method] = mapFunction(method);
      return acc;
    }, {});
  }
  /**
   * Factory function to create the component templates only once
   * @param   {Function} template - component template creation function
   * @param   {Object} components - object containing the nested components
   * @returns {TemplateChunk} template chunk object
   */


  function componentTemplateFactory(template, components) {
    return template(create$6, expressionTypes, bindingTypes, name => {
      return components[name] || COMPONENTS_IMPLEMENTATION_MAP.get(name);
    });
  }
  /**
   * Create a pure component
   * @param   {Function} pureFactoryFunction - pure component factory function
   * @param   {Array} options.slots - component slots
   * @param   {Array} options.attributes - component attributes
   * @param   {Array} options.template - template factory function
   * @param   {Array} options.template - template factory function
   * @param   {any} options.props - initial component properties
   * @returns {Object} pure component object
   */


  function createPureComponent(pureFactoryFunction, _ref) {
    let {
      slots,
      attributes,
      props,
      css,
      template
    } = _ref;
    if (template) panic('Pure components can not have html');
    if (css) panic('Pure components do not have css');
    const component = defineDefaults(pureFactoryFunction({
      slots,
      attributes,
      props
    }), PURE_COMPONENT_API);
    return createCoreAPIMethods(method => function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      // intercept the mount calls to bind the DOM node to the pure object created
      // see also https://github.com/riot/riot/issues/2806
      if (method === MOUNT_METHOD_KEY) {
        const [el] = args; // mark this node as pure element

        el[IS_PURE_SYMBOL] = true;
        bindDOMNodeToComponentObject(el, component);
      }

      component[method](...args);
      return component;
    });
  }
  /**
   * Create the component interface needed for the @riotjs/dom-bindings tag bindings
   * @param   {string} options.css - component css
   * @param   {Function} options.template - functon that will return the dom-bindings template function
   * @param   {Object} options.exports - component interface
   * @param   {string} options.name - component name
   * @returns {Object} component like interface
   */


  function createComponent(_ref2) {
    let {
      css,
      template,
      exports,
      name
    } = _ref2;
    const templateFn = template ? componentTemplateFactory(template, exports ? createSubcomponents(exports.components) : {}) : MOCKED_TEMPLATE_INTERFACE;
    return (_ref3) => {
      let {
        slots,
        attributes,
        props
      } = _ref3;
      // pure components rendering will be managed by the end user
      if (exports && exports[IS_PURE_SYMBOL]) return createPureComponent(exports, {
        slots,
        attributes,
        props,
        css,
        template
      });
      const componentAPI = callOrAssign(exports) || {};
      const component = defineComponent({
        css,
        template: templateFn,
        componentAPI,
        name
      })({
        slots,
        attributes,
        props
      }); // notice that for the components create via tag binding
      // we need to invert the mount (state/parentScope) arguments
      // the template bindings will only forward the parentScope updates
      // and never deal with the component state

      return {
        mount(element, parentScope, state) {
          return component.mount(element, state, parentScope);
        },

        update(parentScope, state) {
          return component.update(state, parentScope);
        },

        unmount(preserveRoot) {
          return component.unmount(preserveRoot);
        }

      };
    };
  }
  /**
   * Component definition function
   * @param   {Object} implementation - the componen implementation will be generated via compiler
   * @param   {Object} component - the component initial properties
   * @returns {Object} a new component implementation object
   */

  function defineComponent(_ref4) {
    let {
      css,
      template,
      componentAPI,
      name
    } = _ref4;
    // add the component css into the DOM
    if (css && name) cssManager.add(name, css);
    return curry(enhanceComponentAPI)(defineProperties( // set the component defaults without overriding the original component API
    defineDefaults(componentAPI, Object.assign({}, COMPONENT_LIFECYCLE_METHODS, {
      [STATE_KEY]: {}
    })), Object.assign({
      // defined during the component creation
      [SLOTS_KEY]: null,
      [ROOT_KEY]: null
    }, COMPONENT_CORE_HELPERS, {
      name,
      css,
      template
    })));
  }
  /**
   * Create the bindings to update the component attributes
   * @param   {HTMLElement} node - node where we will bind the expressions
   * @param   {Array} attributes - list of attribute bindings
   * @returns {TemplateChunk} - template bindings object
   */

  function createAttributeBindings(node, attributes) {
    if (attributes === void 0) {
      attributes = [];
    }

    const expressions = attributes.map(a => create$2(node, a));
    const binding = {};
    return Object.assign(binding, Object.assign({
      expressions
    }, createCoreAPIMethods(method => scope => {
      expressions.forEach(e => e[method](scope));
      return binding;
    })));
  }
  /**
   * Create the subcomponents that can be included inside a tag in runtime
   * @param   {Object} components - components imported in runtime
   * @returns {Object} all the components transformed into Riot.Component factory functions
   */


  function createSubcomponents(components) {
    if (components === void 0) {
      components = {};
    }

    return Object.entries(callOrAssign(components)).reduce((acc, _ref5) => {
      let [key, value] = _ref5;
      acc[camelToDashCase(key)] = createComponent(value);
      return acc;
    }, {});
  }
  /**
   * Run the component instance through all the plugins set by the user
   * @param   {Object} component - component instance
   * @returns {Object} the component enhanced by the plugins
   */


  function runPlugins(component) {
    return [...PLUGINS_SET].reduce((c, fn) => fn(c) || c, component);
  }
  /**
   * Compute the component current state merging it with its previous state
   * @param   {Object} oldState - previous state object
   * @param   {Object} newState - new state givent to the `update` call
   * @returns {Object} new object state
   */


  function computeState(oldState, newState) {
    return Object.assign({}, oldState, callOrAssign(newState));
  }
  /**
   * Add eventually the "is" attribute to link this DOM node to its css
   * @param {HTMLElement} element - target root node
   * @param {string} name - name of the component mounted
   * @returns {undefined} it's a void function
   */


  function addCssHook(element, name) {
    if (getName(element) !== name) {
      set(element, IS_DIRECTIVE, name);
    }
  }
  /**
   * Component creation factory function that will enhance the user provided API
   * @param   {Object} component - a component implementation previously defined
   * @param   {Array} options.slots - component slots generated via riot compiler
   * @param   {Array} options.attributes - attribute expressions generated via riot compiler
   * @returns {Riot.Component} a riot component instance
   */


  function enhanceComponentAPI(component, _ref6) {
    let {
      slots,
      attributes,
      props
    } = _ref6;
    return autobindMethods(runPlugins(defineProperties(Object.create(component), {
      mount(element, state, parentScope) {
        if (state === void 0) {
          state = {};
        }

        this[ATTRIBUTES_KEY_SYMBOL] = createAttributeBindings(element, attributes).mount(parentScope);
        defineProperty(this, PROPS_KEY, Object.freeze(Object.assign({}, evaluateInitialProps(element, props), evaluateAttributeExpressions(this[ATTRIBUTES_KEY_SYMBOL].expressions))));
        this[STATE_KEY] = computeState(this[STATE_KEY], state);
        this[TEMPLATE_KEY_SYMBOL] = this.template.createDOM(element).clone(); // link this object to the DOM node

        bindDOMNodeToComponentObject(element, this); // add eventually the 'is' attribute

        component.name && addCssHook(element, component.name); // define the root element

        defineProperty(this, ROOT_KEY, element); // define the slots array

        defineProperty(this, SLOTS_KEY, slots); // before mount lifecycle event

        this[ON_BEFORE_MOUNT_KEY](this[PROPS_KEY], this[STATE_KEY]);
        this[PARENT_KEY_SYMBOL] = parentScope; // mount the template

        this[TEMPLATE_KEY_SYMBOL].mount(element, this, parentScope);
        this[ON_MOUNTED_KEY](this[PROPS_KEY], this[STATE_KEY]);
        return this;
      },

      update(state, parentScope) {
        if (state === void 0) {
          state = {};
        }

        if (parentScope) {
          this[PARENT_KEY_SYMBOL] = parentScope;
          this[ATTRIBUTES_KEY_SYMBOL].update(parentScope);
        }

        const newProps = evaluateAttributeExpressions(this[ATTRIBUTES_KEY_SYMBOL].expressions);
        if (this[SHOULD_UPDATE_KEY](newProps, this[PROPS_KEY]) === false) return;
        defineProperty(this, PROPS_KEY, Object.freeze(Object.assign({}, this[PROPS_KEY], newProps)));
        this[STATE_KEY] = computeState(this[STATE_KEY], state);
        this[ON_BEFORE_UPDATE_KEY](this[PROPS_KEY], this[STATE_KEY]);
        this[TEMPLATE_KEY_SYMBOL].update(this, this[PARENT_KEY_SYMBOL]);
        this[ON_UPDATED_KEY](this[PROPS_KEY], this[STATE_KEY]);
        return this;
      },

      unmount(preserveRoot) {
        this[ON_BEFORE_UNMOUNT_KEY](this[PROPS_KEY], this[STATE_KEY]);
        this[ATTRIBUTES_KEY_SYMBOL].unmount(); // if the preserveRoot is null the template html will be left untouched
        // in that case the DOM cleanup will happen differently from a parent node

        this[TEMPLATE_KEY_SYMBOL].unmount(this, this[PARENT_KEY_SYMBOL], preserveRoot === null ? null : !preserveRoot);
        this[ON_UNMOUNTED_KEY](this[PROPS_KEY], this[STATE_KEY]);
        return this;
      }

    })), Object.keys(component).filter(prop => isFunction(component[prop])));
  }

  /**
   * Similar to compose but performs from left-to-right function composition.<br/>
   * {@link https://30secondsofcode.org/function#composeright see also}
   * @param   {...[function]} fns) - list of unary function
   * @returns {*} result of the computation
   */
  /**
   * Performs right-to-left function composition.<br/>
   * Use Array.prototype.reduce() to perform right-to-left function composition.<br/>
   * The last (rightmost) function can accept one or more arguments; the remaining functions must be unary.<br/>
   * {@link https://30secondsofcode.org/function#compose original source code}
   * @param   {...[function]} fns) - list of unary function
   * @returns {*} result of the computation
   */

  function compose() {
    for (var _len2 = arguments.length, fns = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      fns[_key2] = arguments[_key2];
    }

    return fns.reduce((f, g) => function () {
      return f(g(...arguments));
    });
  }
  /**
   * Helper method to create component without relying on the registered ones
   * @param   {Object} implementation - component implementation
   * @returns {Function} function that will allow you to mount a riot component on a DOM node
   */

  function component(implementation) {
    return function (el, props, _temp) {
      let {
        slots,
        attributes,
        parentScope
      } = _temp === void 0 ? {} : _temp;
      return compose(c => c.mount(el, parentScope), c => c({
        props,
        slots,
        attributes
      }), createComponent)(implementation);
    };
  }

  /**
   * Tokenize input string.
   */
  function lexer(str) {
      var tokens = [];
      var i = 0;
      while (i < str.length) {
          var char = str[i];
          if (char === "*" || char === "+" || char === "?") {
              tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
              continue;
          }
          if (char === "\\") {
              tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
              continue;
          }
          if (char === "{") {
              tokens.push({ type: "OPEN", index: i, value: str[i++] });
              continue;
          }
          if (char === "}") {
              tokens.push({ type: "CLOSE", index: i, value: str[i++] });
              continue;
          }
          if (char === ":") {
              var name = "";
              var j = i + 1;
              while (j < str.length) {
                  var code = str.charCodeAt(j);
                  if (
                  // `0-9`
                  (code >= 48 && code <= 57) ||
                      // `A-Z`
                      (code >= 65 && code <= 90) ||
                      // `a-z`
                      (code >= 97 && code <= 122) ||
                      // `_`
                      code === 95) {
                      name += str[j++];
                      continue;
                  }
                  break;
              }
              if (!name)
                  throw new TypeError("Missing parameter name at " + i);
              tokens.push({ type: "NAME", index: i, value: name });
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
                  }
                  else if (str[j] === "(") {
                      count++;
                      if (str[j + 1] !== "?") {
                          throw new TypeError("Capturing groups are not allowed at " + j);
                      }
                  }
                  pattern += str[j++];
              }
              if (count)
                  throw new TypeError("Unbalanced pattern at " + i);
              if (!pattern)
                  throw new TypeError("Missing pattern at " + i);
              tokens.push({ type: "PATTERN", index: i, value: pattern });
              i = j;
              continue;
          }
          tokens.push({ type: "CHAR", index: i, value: str[i++] });
      }
      tokens.push({ type: "END", index: i, value: "" });
      return tokens;
  }
  /**
   * Parse a string for the raw tokens.
   */
  function parse(str, options) {
      if (options === void 0) { options = {}; }
      var tokens = lexer(str);
      var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
      var defaultPattern = "[^" + escapeString(options.delimiter || "/#?") + "]+?";
      var result = [];
      var key = 0;
      var i = 0;
      var path = "";
      var tryConsume = function (type) {
          if (i < tokens.length && tokens[i].type === type)
              return tokens[i++].value;
      };
      var mustConsume = function (type) {
          var value = tryConsume(type);
          if (value !== undefined)
              return value;
          var _a = tokens[i], nextType = _a.type, index = _a.index;
          throw new TypeError("Unexpected " + nextType + " at " + index + ", expected " + type);
      };
      var consumeText = function () {
          var result = "";
          var value;
          // tslint:disable-next-line
          while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
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
      if (!keys)
          return path;
      var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
      var index = 0;
      var execResult = groupsRegex.exec(path.source);
      while (execResult) {
          keys.push({
              // Use parenthesized substring match if available, index otherwise
              name: execResult[1] || index++,
              prefix: "",
              suffix: "",
              modifier: "",
              pattern: ""
          });
          execResult = groupsRegex.exec(path.source);
      }
      return path;
  }
  /**
   * Transform an array into a regexp.
   */
  function arrayToRegexp(paths, keys, options) {
      var parts = paths.map(function (path) { return pathToRegexp(path, keys, options).source; });
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
      if (options === void 0) { options = {}; }
      var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function (x) { return x; } : _d;
      var endsWith = "[" + escapeString(options.endsWith || "") + "]|$";
      var delimiter = "[" + escapeString(options.delimiter || "/#?") + "]";
      var route = start ? "^" : "";
      // Iterate over the tokens and create our regexp string.
      for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
          var token = tokens_1[_i];
          if (typeof token === "string") {
              route += escapeString(encode(token));
          }
          else {
              var prefix = escapeString(encode(token.prefix));
              var suffix = escapeString(encode(token.suffix));
              if (token.pattern) {
                  if (keys)
                      keys.push(token);
                  if (prefix || suffix) {
                      if (token.modifier === "+" || token.modifier === "*") {
                          var mod = token.modifier === "*" ? "?" : "";
                          route += "(?:" + prefix + "((?:" + token.pattern + ")(?:" + suffix + prefix + "(?:" + token.pattern + "))*)" + suffix + ")" + mod;
                      }
                      else {
                          route += "(?:" + prefix + "(" + token.pattern + ")" + suffix + ")" + token.modifier;
                      }
                  }
                  else {
                      route += "(" + token.pattern + ")" + token.modifier;
                  }
              }
              else {
                  route += "(?:" + prefix + suffix + ")" + token.modifier;
              }
          }
      }
      if (end) {
          if (!strict)
              route += delimiter + "?";
          route += !options.endsWith ? "$" : "(?=" + endsWith + ")";
      }
      else {
          var endToken = tokens[tokens.length - 1];
          var isEndDelimited = typeof endToken === "string"
              ? delimiter.indexOf(endToken[endToken.length - 1]) > -1
              : // tslint:disable-next-line
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
      if (path instanceof RegExp)
          return regexpToRegexp(path, keys);
      if (Array.isArray(path))
          return arrayToRegexp(path, keys, options);
      return stringToRegexp(path, keys, options);
  }

  class Dispatcher {
    /**
     * Create a dispatcher instance.
     */
    constructor() {
      this._events = {};
    }

    /**
     * Destroy instance.
     */
    destroy () {
      this._events = null;
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
        ];
      } else {
        // Check if callback in event. If not add it.
        if (this._events[name].indexOf(callback) < 0) {
          this._events[name].push(callback);
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

      const index = this._events[name].indexOf(callback);
      // Check if callback in event. If so remove it.
      if (index >= 0) {
        this._events[name].splice(index, 1);
      }
    }

    /**
     * Remove all listeners listening to the dispatcher or just the named events.
     * @param {String} name Optional event name.
     */
    removeAllListeners (name = null) {
      // Check if event by name exists.
      if (name && !Object.prototype.hasOwnProperty.call(this._events, name)) {
        return
      }

      // Reset event with specified name.
      delete this._events[name];
    }

    /**
     * Invokes the callback functions matching the event name.
     * @param {String} name Event name.
     * @param {Any} data Variables to give to the callback function.
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
        callback(...data); // eslint-disable-line
      });
    }
  }

  // Import external modules.

  class Router extends Dispatcher {
    constructor(options = null) {
      super();

      // Overwrite default with given options.
      this._options = Object.assign({
        basePath: '',
        updateHistory: false,
        pathToRegexp: {},
      }, options);

      this._pathCurrent = null;
      this._routes = {};
      this._routeCurrent = null;
    }

    destroy () {
      this._options = null;
      this._pathCurrent = null;
      this._routeCurrent = null;
      this._routes = null;

      super.destroy();
    }

    getPath () {
      return this._pathCurrent
    }

    addRoute (path, options = {}) {
      // Create routes test function.
      const regexp = pathToRegexp(path, [], options);
      const test = (_path) => {
        return regexp.test(_path)
      };

      // Add route to list.
      this._routes[path] = test;

      // Dispatch add event.
      this.dispatch('added', {
        route: path,
        router: this,
      });
    }

    removeRoute (path) {
      delete this._routes[path];
    }

    getRoutes () {
      return Object.keys(this._routes)
    }

    push (path) {
      // Remove base url, if present.
      const pathNew = path.replace(this._options.basePath, '');
      if (this._pathCurrent === pathNew) {
        return true
      }

      // Find matching routes.
      let routeNew = null;
      for (const routePath in this._routes) {
        const match = this._routes[routePath];
        if (!match(pathNew)) {
          continue
        }

        routeNew = routePath;
        break
      }

      if (!routeNew) {
        return false
      }
      this._pathCurrent = pathNew;
      this._routeCurrent = routeNew;

      // Update page history if options set and window global exists.
      if (this._options.updateHistory && typeof window !== 'undefined') {
        // Construct url.
        const url = path.includes(this._options.basePath) ? path : this._options.basePath + path;
        // Check if url is not current url.
        if (url !== window.history.location) {
          // Add path to history.
          window.history.pushState(null, window.document.title, url);
        }
      }

      // Dispatch event on router.
      this.dispatch('pushed', {
        path: this._pathCurrent,
        router: this,
        route: this._routeCurrent,
      });

      return true
    }
  }

  const EACH$1 = 0;
  const IF$1 = 1;
  const SIMPLE$1 = 2;
  const TAG$1 = 3;
  const SLOT$1 = 4;

  var bindingTypes$1 = {
    EACH: EACH$1,
    IF: IF$1,
    SIMPLE: SIMPLE$1,
    TAG: TAG$1,
    SLOT: SLOT$1
  };

  /**
   * Convert a string from camel case to dash-case
   * @param   {string} string - probably a component tag name
   * @returns {string} component name normalized
   */

  /**
   * Convert a string containing dashes to camel case
   * @param   {string} string - input string
   * @returns {string} my-string -> myString
   */
  function dashToCamelCase$1(string) {
    return string.replace(/-(\w)/g, (_, c) => c.toUpperCase())
  }

  /**
   * Move all the child nodes from a source tag to another
   * @param   {HTMLElement} source - source node
   * @param   {HTMLElement} target - target node
   * @returns {undefined} it's a void method ¯\_(ツ)_/¯
   */

  // Ignore this helper because it's needed only for svg tags
  function moveChildren$1(source, target) {
    if (source.firstChild) {
      target.appendChild(source.firstChild);
      moveChildren$1(source, target);
    }
  }

  /**
   * Remove the child nodes from any DOM node
   * @param   {HTMLElement} node - target node
   * @returns {undefined}
   */
  function cleanNode$1(node) {
    clearChildren$1(node.childNodes);
  }

  /**
   * Clear multiple children in a node
   * @param   {HTMLElement[]} children - direct children nodes
   * @returns {undefined}
   */
  function clearChildren$1(children) {
    Array.from(children).forEach(removeChild$1);
  }


  /**
   * Remove a node
   * @param {HTMLElement}node - node to remove
   * @returns {undefined}
   */
  const removeChild$1 = node => node && node.parentNode && node.parentNode.removeChild(node);

  /**
   * Insert before a node
   * @param {HTMLElement} newNode - node to insert
   * @param {HTMLElement} refNode - ref child
   * @returns {undefined}
   */
  const insertBefore$1 = (newNode, refNode) => refNode && refNode.parentNode && refNode.parentNode.insertBefore(newNode, refNode);

  /**
   * Replace a node
   * @param {HTMLElement} newNode - new node to add to the DOM
   * @param {HTMLElement} replaced - node to replace
   * @returns {undefined}
   */
  const replaceChild$1 = (newNode, replaced) => replaced && replaced.parentNode && replaced.parentNode.replaceChild(newNode, replaced);

  // Riot.js constants that can be used accross more modules

  const 
    IS_PURE_SYMBOL$1 = Symbol.for('pure'),
    PARENT_KEY_SYMBOL$1 = Symbol('parent');

  const ATTRIBUTE$1 = 0;
  const EVENT$1 = 1;
  const TEXT$1 = 2;
  const VALUE$1 = 3;

  /**
   * Create the template meta object in case of <template> fragments
   * @param   {TemplateChunk} componentTemplate - template chunk object
   * @returns {Object} the meta property that will be passed to the mount function of the TemplateChunk
   */
  function createTemplateMeta$1(componentTemplate) {
    const fragment = componentTemplate.dom.cloneNode(true);

    return {
      avoidDOMInjection: true,
      fragment,
      children: Array.from(fragment.childNodes)
    }
  }

  /**
   * Quick type checking
   * @param   {*} element - anything
   * @param   {string} type - type definition
   * @returns {boolean} true if the type corresponds
   */
  function checkType$1(element, type) {
    return typeof element === type
  }

  /**
   * Check if an element is part of an svg
   * @param   {HTMLElement}  el - element to check
   * @returns {boolean} true if we are in an svg context
   */
  function isSvg$1(el) {
    const owner = el.ownerSVGElement;

    return !!owner || owner === null
  }

  /**
   * Check if an element is a template tag
   * @param   {HTMLElement}  el - element to check
   * @returns {boolean} true if it's a <template>
   */
  function isTemplate$1(el) {
    return !isNil$1(el.content)
  }

  /**
   * Check that will be passed if its argument is a function
   * @param   {*} value - value to check
   * @returns {boolean} - true if the value is a function
   */
  function isFunction$1(value) {
    return checkType$1(value, 'function')
  }

  /**
   * Check if a value is a Boolean
   * @param   {*}  value - anything
   * @returns {boolean} true only for the value is a boolean
   */
  function isBoolean$1(value) {
    return checkType$1(value, 'boolean')
  }

  /**
   * Check if a value is an Object
   * @param   {*}  value - anything
   * @returns {boolean} true only for the value is an object
   */
  function isObject$1(value) {
    return !isNil$1(value) && checkType$1(value, 'object')
  }

  /**
   * Check if a value is null or undefined
   * @param   {*}  value - anything
   * @returns {boolean} true only for the 'undefined' and 'null' types
   */
  function isNil$1(value) {
    return value === null || value === undefined
  }

  /**
   * ISC License
   *
   * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
   * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
   * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
   * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
   * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
   * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
   * PERFORMANCE OF THIS SOFTWARE.
   */

  // fork of https://github.com/WebReflection/udomdiff version 1.1.0
  // due to https://github.com/WebReflection/udomdiff/pull/2
  /* eslint-disable */

  /**
   * @param {Node} parentNode The container where children live
   * @param {Node[]} a The list of current/live children
   * @param {Node[]} b The list of future children
   * @param {(entry: Node, action: number) => Node} get
   * The callback invoked per each entry related DOM operation.
   * @param {Node} [before] The optional node used as anchor to insert before.
   * @returns {Node[]} The same list of future children.
   */
  var udomdiff$1 = (parentNode, a, b, get, before) => {
    const bLength = b.length;
    let aEnd = a.length;
    let bEnd = bLength;
    let aStart = 0;
    let bStart = 0;
    let map = null;
    while (aStart < aEnd || bStart < bEnd) {
      // append head, tail, or nodes in between: fast path
      if (aEnd === aStart) {
        // we could be in a situation where the rest of nodes that
        // need to be added are not at the end, and in such case
        // the node to `insertBefore`, if the index is more than 0
        // must be retrieved, otherwise it's gonna be the first item.
        const node = bEnd < bLength ?
          (bStart ?
            (get(b[bStart - 1], -0).nextSibling) :
            get(b[bEnd - bStart], 0)) :
          before;
        while (bStart < bEnd)
          insertBefore$1(get(b[bStart++], 1), node);
      }
      // remove head or tail: fast path
      else if (bEnd === bStart) {
        while (aStart < aEnd) {
          // remove the node only if it's unknown or not live
          if (!map || !map.has(a[aStart]))
            removeChild$1(get(a[aStart], -1));
          aStart++;
        }
      }
      // same node: fast path
      else if (a[aStart] === b[bStart]) {
        aStart++;
        bStart++;
      }
      // same tail: fast path
      else if (a[aEnd - 1] === b[bEnd - 1]) {
        aEnd--;
        bEnd--;
      }
        // The once here single last swap "fast path" has been removed in v1.1.0
        // https://github.com/WebReflection/udomdiff/blob/single-final-swap/esm/index.js#L69-L85
      // reverse swap: also fast path
      else if (
        a[aStart] === b[bEnd - 1] &&
        b[bStart] === a[aEnd - 1]
      ) {
        // this is a "shrink" operation that could happen in these cases:
        // [1, 2, 3, 4, 5]
        // [1, 4, 3, 2, 5]
        // or asymmetric too
        // [1, 2, 3, 4, 5]
        // [1, 2, 3, 5, 6, 4]
        const node = get(a[--aEnd], -1).nextSibling;
        insertBefore$1(
          get(b[bStart++], 1),
          get(a[aStart++], -1).nextSibling
        );
        insertBefore$1(get(b[--bEnd], 1), node);
        // mark the future index as identical (yeah, it's dirty, but cheap 👍)
        // The main reason to do this, is that when a[aEnd] will be reached,
        // the loop will likely be on the fast path, as identical to b[bEnd].
        // In the best case scenario, the next loop will skip the tail,
        // but in the worst one, this node will be considered as already
        // processed, bailing out pretty quickly from the map index check
        a[aEnd] = b[bEnd];
      }
      // map based fallback, "slow" path
      else {
        // the map requires an O(bEnd - bStart) operation once
        // to store all future nodes indexes for later purposes.
        // In the worst case scenario, this is a full O(N) cost,
        // and such scenario happens at least when all nodes are different,
        // but also if both first and last items of the lists are different
        if (!map) {
          map = new Map;
          let i = bStart;
          while (i < bEnd)
            map.set(b[i], i++);
        }
        // if it's a future node, hence it needs some handling
        if (map.has(a[aStart])) {
          // grab the index of such node, 'cause it might have been processed
          const index = map.get(a[aStart]);
          // if it's not already processed, look on demand for the next LCS
          if (bStart < index && index < bEnd) {
            let i = aStart;
            // counts the amount of nodes that are the same in the future
            let sequence = 1;
            while (++i < aEnd && i < bEnd && map.get(a[i]) === (index + sequence))
              sequence++;
            // effort decision here: if the sequence is longer than replaces
            // needed to reach such sequence, which would brings again this loop
            // to the fast path, prepend the difference before a sequence,
            // and move only the future list index forward, so that aStart
            // and bStart will be aligned again, hence on the fast path.
            // An example considering aStart and bStart are both 0:
            // a: [1, 2, 3, 4]
            // b: [7, 1, 2, 3, 6]
            // this would place 7 before 1 and, from that time on, 1, 2, and 3
            // will be processed at zero cost
            if (sequence > (index - bStart)) {
              const node = get(a[aStart], 0);
              while (bStart < index)
                insertBefore$1(get(b[bStart++], 1), node);
            }
              // if the effort wasn't good enough, fallback to a replace,
              // moving both source and target indexes forward, hoping that some
            // similar node will be found later on, to go back to the fast path
            else {
              replaceChild$1(
                get(b[bStart++], 1),
                get(a[aStart++], -1)
              );
            }
          }
          // otherwise move the source forward, 'cause there's nothing to do
          else
            aStart++;
        }
          // this node has no meaning in the future list, so it's more than safe
          // to remove it, and check the next live node out instead, meaning
        // that only the live list index should be forwarded
        else
          removeChild$1(get(a[aStart++], -1));
      }
    }
    return b
  };

  const UNMOUNT_SCOPE$1 = Symbol('unmount');

  const EachBinding$1 = {
    // dynamic binding properties
    // childrenMap: null,
    // node: null,
    // root: null,
    // condition: null,
    // evaluate: null,
    // template: null,
    // isTemplateTag: false,
    nodes: [],
    // getKey: null,
    // indexName: null,
    // itemName: null,
    // afterPlaceholder: null,
    // placeholder: null,

    // API methods
    mount(scope, parentScope) {
      return this.update(scope, parentScope)
    },
    update(scope, parentScope) {
      const {placeholder, nodes, childrenMap} = this;
      const collection = scope === UNMOUNT_SCOPE$1 ? null : this.evaluate(scope);
      const items = collection ? Array.from(collection) : [];
      const parent = placeholder.parentNode;

      // prepare the diffing
      const {
        newChildrenMap,
        batches,
        futureNodes
      } = createPatch$1(items, scope, parentScope, this);

      // patch the DOM only if there are new nodes
      udomdiff$1(parent,
        nodes,
        futureNodes,
        patch$1(
          Array.from(childrenMap.values()),
          parentScope
        ),
        placeholder
      );

      // trigger the mounts and the updates
      batches.forEach(fn => fn());

      // update the children map
      this.childrenMap = newChildrenMap;
      this.nodes = futureNodes;

      return this
    },
    unmount(scope, parentScope) {
      this.update(UNMOUNT_SCOPE$1, parentScope);

      return this
    }
  };

  /**
   * Patch the DOM while diffing
   * @param   {TemplateChunk[]} redundant - redundant tepmplate chunks
   * @param   {*} parentScope - scope of the parent template
   * @returns {Function} patch function used by domdiff
   */
  function patch$1(redundant, parentScope) {
    return (item, info) => {
      if (info < 0) {
        const element = redundant.pop();
        if (element) {
          const {template, context} = element;
          // notice that we pass null as last argument because
          // the root node and its children will be removed by domdiff
          template.unmount(context, parentScope, null);
        }
      }

      return item
    }
  }

  /**
   * Check whether a template must be filtered from a loop
   * @param   {Function} condition - filter function
   * @param   {Object} context - argument passed to the filter function
   * @returns {boolean} true if this item should be skipped
   */
  function mustFilterItem$1(condition, context) {
    return condition ? Boolean(condition(context)) === false : false
  }

  /**
   * Extend the scope of the looped template
   * @param   {Object} scope - current template scope
   * @param   {string} options.itemName - key to identify the looped item in the new context
   * @param   {string} options.indexName - key to identify the index of the looped item
   * @param   {number} options.index - current index
   * @param   {*} options.item - collection item looped
   * @returns {Object} enhanced scope object
   */
  function extendScope$1(scope, {itemName, indexName, index, item}) {
    scope[itemName] = item;
    if (indexName) scope[indexName] = index;
    return scope
  }

  /**
   * Loop the current template items
   * @param   {Array} items - expression collection value
   * @param   {*} scope - template scope
   * @param   {*} parentScope - scope of the parent template
   * @param   {EeachBinding} binding - each binding object instance
   * @returns {Object} data
   * @returns {Map} data.newChildrenMap - a Map containing the new children template structure
   * @returns {Array} data.batches - array containing the template lifecycle functions to trigger
   * @returns {Array} data.futureNodes - array containing the nodes we need to diff
   */
  function createPatch$1(items, scope, parentScope, binding) {
    const {condition, template, childrenMap, itemName, getKey, indexName, root, isTemplateTag} = binding;
    const newChildrenMap = new Map();
    const batches = [];
    const futureNodes = [];

    items.forEach((item, index) => {
      const context = extendScope$1(Object.create(scope), {itemName, indexName, index, item});
      const key = getKey ? getKey(context) : index;
      const oldItem = childrenMap.get(key);

      if (mustFilterItem$1(condition, context)) {
        return
      }

      const componentTemplate = oldItem ? oldItem.template : template.clone();
      const el = oldItem ? componentTemplate.el : root.cloneNode();
      const mustMount = !oldItem;
      const meta = isTemplateTag && mustMount ? createTemplateMeta$1(componentTemplate) : {};

      if (mustMount) {
        batches.push(() => componentTemplate.mount(el, context, parentScope, meta));
      } else {
        batches.push(() => componentTemplate.update(context, parentScope));
      }

      // create the collection of nodes to update or to add
      // in case of template tags we need to add all its children nodes
      if (isTemplateTag) {
        const children = meta.children || componentTemplate.children;
        futureNodes.push(...children);
      } else {
        futureNodes.push(el);
      }

      // delete the old item from the children map
      childrenMap.delete(key);

      // update the children map
      newChildrenMap.set(key, {
        template: componentTemplate,
        context,
        index
      });
    });

    return {
      newChildrenMap,
      batches,
      futureNodes
    }
  }

  function create$7(node, {evaluate, condition, itemName, indexName, getKey, template}) {
    const placeholder = document.createTextNode('');
    const root = node.cloneNode();

    insertBefore$1(placeholder, node);
    removeChild$1(node);

    return {
      ...EachBinding$1,
      childrenMap: new Map(),
      node,
      root,
      condition,
      evaluate,
      isTemplateTag: isTemplate$1(root),
      template: template.createDOM(node),
      getKey,
      indexName,
      itemName,
      placeholder
    }
  }

  /**
   * Binding responsible for the `if` directive
   */
  const IfBinding$1 = {
    // dynamic binding properties
    // node: null,
    // evaluate: null,
    // isTemplateTag: false,
    // placeholder: null,
    // template: null,

    // API methods
    mount(scope, parentScope) {
      return this.update(scope, parentScope)
    },
    update(scope, parentScope) {
      const value = !!this.evaluate(scope);
      const mustMount = !this.value && value;
      const mustUnmount = this.value && !value;
      const mount = () => {
        const pristine = this.node.cloneNode();

        insertBefore$1(pristine, this.placeholder);
        this.template = this.template.clone();
        this.template.mount(pristine, scope, parentScope);
      };

      switch (true) {
      case mustMount:
        mount();
        break
      case mustUnmount:
        this.unmount(scope);
        break
      default:
        if (value) this.template.update(scope, parentScope);
      }

      this.value = value;

      return this
    },
    unmount(scope, parentScope) {
      this.template.unmount(scope, parentScope, true);

      return this
    }
  };

  function create$8(node, { evaluate, template }) {
    const placeholder = document.createTextNode('');

    insertBefore$1(placeholder, node);
    removeChild$1(node);

    return {
      ...IfBinding$1,
      node,
      evaluate,
      placeholder,
      template: template.createDOM(node)
    }
  }

  /**
   * Returns the memoized (cached) function.
   * // borrowed from https://www.30secondsofcode.org/js/s/memoize
   * @param {Function} fn - function to memoize
   * @returns {Function} memoize function
   */
  function memoize$1(fn) {
    const cache = new Map();
    const cached = val => {
      return cache.has(val) ? cache.get(val) : cache.set(val, fn.call(this, val)) && cache.get(val)
    };
    cached.cache = cache;
    return cached
  }

  /**
   * Evaluate a list of attribute expressions
   * @param   {Array} attributes - attribute expressions generated by the riot compiler
   * @returns {Object} key value pairs with the result of the computation
   */
  function evaluateAttributeExpressions$1(attributes) {
    return attributes.reduce((acc, attribute) => {
      const {value, type} = attribute;

      switch (true) {
      // spread attribute
      case !attribute.name && type === ATTRIBUTE$1:
        return {
          ...acc,
          ...value
        }
      // value attribute
      case type === VALUE$1:
        acc.value = attribute.value;
        break
      // normal attributes
      default:
        acc[dashToCamelCase$1(attribute.name)] = attribute.value;
      }

      return acc
    }, {})
  }

  const REMOVE_ATTRIBUTE$1 = 'removeAttribute';
  const SET_ATTIBUTE$1 = 'setAttribute';
  const ElementProto$1 = typeof Element === 'undefined' ? {} : Element.prototype;
  const isNativeHtmlProperty$1 = memoize$1(name => ElementProto$1.hasOwnProperty(name) ); // eslint-disable-line

  /**
   * Add all the attributes provided
   * @param   {HTMLElement} node - target node
   * @param   {Object} attributes - object containing the attributes names and values
   * @returns {undefined} sorry it's a void function :(
   */
  function setAllAttributes$1(node, attributes) {
    Object
      .entries(attributes)
      .forEach(([name, value]) => attributeExpression$1(node, { name }, value));
  }

  /**
   * Remove all the attributes provided
   * @param   {HTMLElement} node - target node
   * @param   {Object} newAttributes - object containing all the new attribute names
   * @param   {Object} oldAttributes - object containing all the old attribute names
   * @returns {undefined} sorry it's a void function :(
   */
  function removeAllAttributes$1(node, newAttributes, oldAttributes) {
    const newKeys = newAttributes ? Object.keys(newAttributes) : [];

    Object
      .keys(oldAttributes)
      .filter(name => !newKeys.includes(name))
      .forEach(attribute => node.removeAttribute(attribute));
  }

  /**
   * This methods handles the DOM attributes updates
   * @param   {HTMLElement} node - target node
   * @param   {Object} expression - expression object
   * @param   {string} expression.name - attribute name
   * @param   {*} value - new expression value
   * @param   {*} oldValue - the old expression cached value
   * @returns {undefined}
   */
  function attributeExpression$1(node, { name }, value, oldValue) {
    // is it a spread operator? {...attributes}
    if (!name) {
      if (oldValue) {
        // remove all the old attributes
        removeAllAttributes$1(node, value, oldValue);
      }

      // is the value still truthy?
      if (value) {
        setAllAttributes$1(node, value);
      }

      return
    }

    // handle boolean attributes
    if (
      !isNativeHtmlProperty$1(name) && (
        isBoolean$1(value) ||
        isObject$1(value) ||
        isFunction$1(value)
      )
    ) {
      node[name] = value;
    }

    node[getMethod$1(value)](name, normalizeValue$1(name, value));
  }

  /**
   * Get the attribute modifier method
   * @param   {*} value - if truthy we return `setAttribute` othewise `removeAttribute`
   * @returns {string} the node attribute modifier method name
   */
  function getMethod$1(value) {
    return isNil$1(value) ||
      value === false ||
      value === '' ||
      isObject$1(value) ||
      isFunction$1(value) ?
      REMOVE_ATTRIBUTE$1 :
      SET_ATTIBUTE$1
  }

  /**
   * Get the value as string
   * @param   {string} name - attribute name
   * @param   {*} value - user input value
   * @returns {string} input value as string
   */
  function normalizeValue$1(name, value) {
    // be sure that expressions like selected={ true } will be always rendered as selected='selected'
    if (value === true) return name

    return value
  }

  const RE_EVENTS_PREFIX$1 = /^on/;

  const getCallbackAndOptions$1 = value => Array.isArray(value) ? value : [value, false];

  // see also https://medium.com/@WebReflection/dom-handleevent-a-cross-platform-standard-since-year-2000-5bf17287fd38
  const EventListener$1 = {
    handleEvent(event) {
      this[event.type](event);
    }
  };
  const ListenersWeakMap$1 = new WeakMap();

  const createListener$1 = node => {
    const listener = Object.create(EventListener$1);
    ListenersWeakMap$1.set(node, listener);
    return listener
  };

  /**
   * Set a new event listener
   * @param   {HTMLElement} node - target node
   * @param   {Object} expression - expression object
   * @param   {string} expression.name - event name
   * @param   {*} value - new expression value
   * @returns {value} the callback just received
   */
  function eventExpression$1(node, { name }, value) {
    const normalizedEventName = name.replace(RE_EVENTS_PREFIX$1, '');
    const eventListener = ListenersWeakMap$1.get(node) || createListener$1(node);
    const [callback, options] = getCallbackAndOptions$1(value);
    const handler = eventListener[normalizedEventName];
    const mustRemoveEvent = handler && !callback;
    const mustAddEvent = callback && !handler;

    if (mustRemoveEvent) {
      node.removeEventListener(normalizedEventName, eventListener);
    }

    if (mustAddEvent) {
      node.addEventListener(normalizedEventName, eventListener, options);
    }

    eventListener[normalizedEventName] = callback;
  }

  /**
   * Normalize the user value in order to render a empty string in case of falsy values
   * @param   {*} value - user input value
   * @returns {string} hopefully a string
   */
  function normalizeStringValue$1(value) {
    return isNil$1(value) ? '' : value
  }

  /**
   * Get the the target text node to update or create one from of a comment node
   * @param   {HTMLElement} node - any html element containing childNodes
   * @param   {number} childNodeIndex - index of the text node in the childNodes list
   * @returns {HTMLTextNode} the text node to update
   */
  const getTextNode$1 = (node, childNodeIndex) => {
    const target = node.childNodes[childNodeIndex];

    if (target.nodeType === Node.COMMENT_NODE) {
      const textNode = document.createTextNode('');
      node.replaceChild(textNode, target);

      return textNode
    }

    return target
  };

  /**
   * This methods handles a simple text expression update
   * @param   {HTMLElement} node - target node
   * @param   {Object} data - expression object
   * @param   {*} value - new expression value
   * @returns {undefined}
   */
  function textExpression$1(node, data, value) {
    node.data = normalizeStringValue$1(value);
  }

  /**
   * This methods handles the input fileds value updates
   * @param   {HTMLElement} node - target node
   * @param   {Object} expression - expression object
   * @param   {*} value - new expression value
   * @returns {undefined}
   */
  function valueExpression$1(node, expression, value) {
    node.value = normalizeStringValue$1(value);
  }

  var expressions$1 = {
    [ATTRIBUTE$1]: attributeExpression$1,
    [EVENT$1]: eventExpression$1,
    [TEXT$1]: textExpression$1,
    [VALUE$1]: valueExpression$1
  };

  const Expression$1 = {
    // Static props
    // node: null,
    // value: null,

    // API methods
    /**
     * Mount the expression evaluating its initial value
     * @param   {*} scope - argument passed to the expression to evaluate its current values
     * @returns {Expression} self
     */
    mount(scope) {
      // hopefully a pure function
      this.value = this.evaluate(scope);

      // IO() DOM updates
      apply$1(this, this.value);

      return this
    },
    /**
     * Update the expression if its value changed
     * @param   {*} scope - argument passed to the expression to evaluate its current values
     * @returns {Expression} self
     */
    update(scope) {
      // pure function
      const value = this.evaluate(scope);

      if (this.value !== value) {
        // IO() DOM updates
        apply$1(this, value);
        this.value = value;
      }

      return this
    },
    /**
     * Expression teardown method
     * @returns {Expression} self
     */
    unmount() {
      // unmount only the event handling expressions
      if (this.type === EVENT$1) apply$1(this, null);

      return this
    }
  };

  /**
   * IO() function to handle the DOM updates
   * @param {Expression} expression - expression object
   * @param {*} value - current expression value
   * @returns {undefined}
   */
  function apply$1(expression, value) {
    return expressions$1[expression.type](expression.node, expression, value, expression.value)
  }

  function create$9(node, data) {
    return {
      ...Expression$1,
      ...data,
      node: data.type === TEXT$1 ?
        getTextNode$1(node, data.childNodeIndex) :
        node
    }
  }

  /**
   * Create a flat object having as keys a list of methods that if dispatched will propagate
   * on the whole collection
   * @param   {Array} collection - collection to iterate
   * @param   {Array<string>} methods - methods to execute on each item of the collection
   * @param   {*} context - context returned by the new methods created
   * @returns {Object} a new object to simplify the the nested methods dispatching
   */
  function flattenCollectionMethods$1(collection, methods, context) {
    return methods.reduce((acc, method) => {
      return {
        ...acc,
        [method]: (scope) => {
          return collection.map(item => item[method](scope)) && context
        }
      }
    }, {})
  }

  function create$a(node, { expressions }) {
    return {
      ...flattenCollectionMethods$1(
        expressions.map(expression => create$9(node, expression)),
        ['mount', 'update', 'unmount']
      )
    }
  }

  function extendParentScope$1(attributes, scope, parentScope) {
    if (!attributes || !attributes.length) return parentScope

    const expressions = attributes.map(attr => ({
      ...attr,
      value: attr.evaluate(scope)
    }));

    return Object.assign(
      Object.create(parentScope || null),
      evaluateAttributeExpressions$1(expressions)
    )
  }

  // this function is only meant to fix an edge case
  // https://github.com/riot/riot/issues/2842
  const getRealParent$1 = (scope, parentScope) => scope[PARENT_KEY_SYMBOL$1] || parentScope;

  const SlotBinding$1 = {
    // dynamic binding properties
    // node: null,
    // name: null,
    attributes: [],
    // template: null,

    getTemplateScope(scope, parentScope) {
      return extendParentScope$1(this.attributes, scope, parentScope)
    },

    // API methods
    mount(scope, parentScope) {
      const templateData = scope.slots ? scope.slots.find(({id}) => id === this.name) : false;
      const {parentNode} = this.node;
      const realParent = getRealParent$1(scope, parentScope);

      this.template = templateData && create$d(
        templateData.html,
        templateData.bindings
      ).createDOM(parentNode);

      if (this.template) {
        this.template.mount(this.node, this.getTemplateScope(scope, realParent), realParent);
        this.template.children = Array.from(this.node.childNodes);
        moveSlotInnerContent$1(this.node);
      }

      removeChild$1(this.node);

      return this
    },
    update(scope, parentScope) {
      if (this.template) {
        const realParent = getRealParent$1(scope, parentScope);
        this.template.update(this.getTemplateScope(scope, realParent), realParent);
      }

      return this
    },
    unmount(scope, parentScope, mustRemoveRoot) {
      if (this.template) {
        this.template.unmount(this.getTemplateScope(scope, parentScope), null, mustRemoveRoot);
      }

      return this
    }
  };

  /**
   * Move the inner content of the slots outside of them
   * @param   {HTMLElement} slot - slot node
   * @returns {undefined} it's a void method ¯\_(ツ)_/¯
   */
  function moveSlotInnerContent$1(slot) {
    const child = slot && slot.firstChild;

    if (!child) return

    insertBefore$1(child, slot);
    moveSlotInnerContent$1(slot);
  }

  /**
   * Create a single slot binding
   * @param   {HTMLElement} node - slot node
   * @param   {string} options.name - slot id
   * @returns {Object} Slot binding object
   */
  function createSlot$1(node, { name, attributes }) {
    return {
      ...SlotBinding$1,
      attributes,
      node,
      name
    }
  }

  /**
   * Create a new tag object if it was registered before, otherwise fallback to the simple
   * template chunk
   * @param   {Function} component - component factory function
   * @param   {Array<Object>} slots - array containing the slots markup
   * @param   {Array} attributes - dynamic attributes that will be received by the tag element
   * @returns {TagImplementation|TemplateChunk} a tag implementation or a template chunk as fallback
   */
  function getTag$1(component, slots = [], attributes = []) {
    // if this tag was registered before we will return its implementation
    if (component) {
      return component({slots, attributes})
    }

    // otherwise we return a template chunk
    return create$d(slotsToMarkup$1(slots), [
      ...slotBindings$1(slots), {
        // the attributes should be registered as binding
        // if we fallback to a normal template chunk
        expressions: attributes.map(attr => {
          return {
            type: ATTRIBUTE$1,
            ...attr
          }
        })
      }
    ])
  }


  /**
   * Merge all the slots bindings into a single array
   * @param   {Array<Object>} slots - slots collection
   * @returns {Array<Bindings>} flatten bindings array
   */
  function slotBindings$1(slots) {
    return slots.reduce((acc, {bindings}) => acc.concat(bindings), [])
  }

  /**
   * Merge all the slots together in a single markup string
   * @param   {Array<Object>} slots - slots collection
   * @returns {string} markup of all the slots in a single string
   */
  function slotsToMarkup$1(slots) {
    return slots.reduce((acc, slot) => {
      return acc + slot.html
    }, '')
  }


  const TagBinding$1 = {
    // dynamic binding properties
    // node: null,
    // evaluate: null,
    // name: null,
    // slots: null,
    // tag: null,
    // attributes: null,
    // getComponent: null,

    mount(scope) {
      return this.update(scope)
    },
    update(scope, parentScope) {
      const name = this.evaluate(scope);

      // simple update
      if (name === this.name) {
        this.tag.update(scope);
      } else {
        // unmount the old tag if it exists
        this.unmount(scope, parentScope, true);

        // mount the new tag
        this.name = name;
        this.tag = getTag$1(this.getComponent(name), this.slots, this.attributes);
        this.tag.mount(this.node, scope);
      }

      return this
    },
    unmount(scope, parentScope, keepRootTag) {
      if (this.tag) {
        // keep the root tag
        this.tag.unmount(keepRootTag);
      }

      return this
    }
  };

  function create$b(node, {evaluate, getComponent, slots, attributes}) {
    return {
      ...TagBinding$1,
      node,
      evaluate,
      slots,
      attributes,
      getComponent
    }
  }

  var bindings$1 = {
    [IF$1]: create$8,
    [SIMPLE$1]: create$a,
    [EACH$1]: create$7,
    [TAG$1]: create$b,
    [SLOT$1]: createSlot$1
  };

  /**
   * Text expressions in a template tag will get childNodeIndex value normalized
   * depending on the position of the <template> tag offset
   * @param   {Expression[]} expressions - riot expressions array
   * @param   {number} textExpressionsOffset - offset of the <template> tag
   * @returns {Expression[]} expressions containing the text expressions normalized
   */
  function fixTextExpressionsOffset$1(expressions, textExpressionsOffset) {
    return expressions.map(e => e.type === TEXT$1 ? {
      ...e,
      childNodeIndex: e.childNodeIndex + textExpressionsOffset
    } : e)
  }

  /**
   * Bind a new expression object to a DOM node
   * @param   {HTMLElement} root - DOM node where to bind the expression
   * @param   {Object} binding - binding data
   * @param   {number|null} templateTagOffset - if it's defined we need to fix the text expressions childNodeIndex offset
   * @returns {Binding} Binding object
   */
  function create$c(root, binding, templateTagOffset) {
    const { selector, type, redundantAttribute, expressions } = binding;
    // find the node to apply the bindings
    const node = selector ? root.querySelector(selector) : root;
    // remove eventually additional attributes created only to select this node
    if (redundantAttribute) node.removeAttribute(redundantAttribute);
    const bindingExpressions = expressions || [];
    // init the binding
    return (bindings$1[type] || bindings$1[SIMPLE$1])(
      node,
      {
        ...binding,
        expressions: templateTagOffset && !selector ?
          fixTextExpressionsOffset$1(bindingExpressions, templateTagOffset) :
          bindingExpressions
      }
    )
  }

  // in this case a simple innerHTML is enough
  function createHTMLTree$1(html, root) {
    const template = isTemplate$1(root) ? root : document.createElement('template');
    template.innerHTML = html;
    return template.content
  }

  // for svg nodes we need a bit more work
  function createSVGTree$1(html, container) {
    // create the SVGNode
    const svgNode = container.ownerDocument.importNode(
      new window.DOMParser()
        .parseFromString(
          `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`,
          'application/xml'
        )
        .documentElement,
      true
    );

    return svgNode
  }

  /**
   * Create the DOM that will be injected
   * @param {Object} root - DOM node to find out the context where the fragment will be created
   * @param   {string} html - DOM to create as string
   * @returns {HTMLDocumentFragment|HTMLElement} a new html fragment
   */
  function createDOMTree$1(root, html) {
    if (isSvg$1(root)) return createSVGTree$1(html, root)

    return createHTMLTree$1(html, root)
  }

  /**
   * Inject the DOM tree into a target node
   * @param   {HTMLElement} el - target element
   * @param   {HTMLFragment|SVGElement} dom - dom tree to inject
   * @returns {undefined}
   */
  function injectDOM$1(el, dom) {
    switch (true) {
    case isSvg$1(el):
      moveChildren$1(dom, el);
      break
    case isTemplate$1(el):
      el.parentNode.replaceChild(dom, el);
      break
    default:
      el.appendChild(dom);
    }
  }

  /**
   * Create the Template DOM skeleton
   * @param   {HTMLElement} el - root node where the DOM will be injected
   * @param   {string} html - markup that will be injected into the root node
   * @returns {HTMLFragment} fragment that will be injected into the root node
   */
  function createTemplateDOM$1(el, html) {
    return html && (typeof html === 'string' ?
      createDOMTree$1(el, html) :
      html)
  }

  /**
   * Template Chunk model
   * @type {Object}
   */
  const TemplateChunk$1 = Object.freeze({
    // Static props
    // bindings: null,
    // bindingsData: null,
    // html: null,
    // isTemplateTag: false,
    // fragment: null,
    // children: null,
    // dom: null,
    // el: null,

    /**
     * Create the template DOM structure that will be cloned on each mount
     * @param   {HTMLElement} el - the root node
     * @returns {TemplateChunk} self
     */
    createDOM(el) {
      // make sure that the DOM gets created before cloning the template
      this.dom = this.dom || createTemplateDOM$1(el, this.html);

      return this
    },

    // API methods
    /**
     * Attach the template to a DOM node
     * @param   {HTMLElement} el - target DOM node
     * @param   {*} scope - template data
     * @param   {*} parentScope - scope of the parent template tag
     * @param   {Object} meta - meta properties needed to handle the <template> tags in loops
     * @returns {TemplateChunk} self
     */
    mount(el, scope, parentScope, meta = {}) {
      if (!el) throw new Error('Please provide DOM node to mount properly your template')

      if (this.el) this.unmount(scope);

      // <template> tags require a bit more work
      // the template fragment might be already created via meta outside of this call
      const {fragment, children, avoidDOMInjection} = meta;
      // <template> bindings of course can not have a root element
      // so we check the parent node to set the query selector bindings
      const {parentNode} = children ? children[0] : el;
      const isTemplateTag = isTemplate$1(el);
      const templateTagOffset = isTemplateTag ? Math.max(
        Array.from(parentNode.childNodes).indexOf(el),
        0
      ) : null;
      this.isTemplateTag = isTemplateTag;

      // create the DOM if it wasn't created before
      this.createDOM(el);

      if (this.dom) {
        // create the new template dom fragment if it want already passed in via meta
        this.fragment = fragment || this.dom.cloneNode(true);
      }

      // store root node
      // notice that for template tags the root note will be the parent tag
      this.el = this.isTemplateTag ? parentNode : el;
      // create the children array only for the <template> fragments
      this.children = this.isTemplateTag ? children || Array.from(this.fragment.childNodes) : null;

      // inject the DOM into the el only if a fragment is available
      if (!avoidDOMInjection && this.fragment) injectDOM$1(el, this.fragment);

      // create the bindings
      this.bindings = this.bindingsData.map(binding => create$c(
        this.el,
        binding,
        templateTagOffset
      ));
      this.bindings.forEach(b => b.mount(scope, parentScope));

      return this
    },
    /**
     * Update the template with fresh data
     * @param   {*} scope - template data
     * @param   {*} parentScope - scope of the parent template tag
     * @returns {TemplateChunk} self
     */
    update(scope, parentScope) {
      this.bindings.forEach(b => b.update(scope, parentScope));

      return this
    },
    /**
     * Remove the template from the node where it was initially mounted
     * @param   {*} scope - template data
     * @param   {*} parentScope - scope of the parent template tag
     * @param   {boolean|null} mustRemoveRoot - if true remove the root element,
     * if false or undefined clean the root tag content, if null don't touch the DOM
     * @returns {TemplateChunk} self
     */
    unmount(scope, parentScope, mustRemoveRoot) {
      if (this.el) {
        this.bindings.forEach(b => b.unmount(scope, parentScope, mustRemoveRoot));

        switch (true) {
        // pure components should handle the DOM unmount updates by themselves
        case this.el[IS_PURE_SYMBOL$1]:
          break
        // <template> tags should be treated a bit differently
        // we need to clear their children only if it's explicitly required by the caller
        // via mustRemoveRoot !== null
        case this.children && mustRemoveRoot !== null:
          clearChildren$1(this.children);
          break

        // remove the root node only if the mustRemoveRoot === true
        case mustRemoveRoot === true:
          removeChild$1(this.el);
          break

        // otherwise we clean the node children
        case mustRemoveRoot !== null:
          cleanNode$1(this.el);
          break
        }

        this.el = null;
      }

      return this
    },
    /**
     * Clone the template chunk
     * @returns {TemplateChunk} a clone of this object resetting the this.el property
     */
    clone() {
      return {
        ...this,
        el: null
      }
    }
  });

  /**
   * Create a template chunk wiring also the bindings
   * @param   {string|HTMLElement} html - template string
   * @param   {Array} bindings - bindings collection
   * @returns {TemplateChunk} a new TemplateChunk copy
   */
  function create$d(html, bindings = []) {
    return {
      ...TemplateChunk$1,
      html,
      bindingsData: bindings
    }
  }

  /**
   * Marks given component as pure component. Is a copy of Riot's own pure function.
   * Because I don't want to import the entire library for just one function.
   * @param {Function|Object} component Function to add pure symbol to.
   * @returns {Function|Object} Component marked as pure.
   */
  const pure = function (component) {
    component[IS_PURE_SYMBOL$1] = true;
    return component
  };

  const ROUTER_COMPONENT = Symbol('riouter');

  // Import external modules.

  var route = {
    'css': null,

    'exports': pure(
      ({ slots, attributes, props }) => {
        const getAttribute = name => attributes && attributes.find(attribute => attribute.name === name);

        return {
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
            this.slot = create$d(null, [{
              type: bindingTypes$1.SLOT,
              name: 'default',
            }]);

            // Get router from parent component.
            this.router = context[ROUTER_COMPONENT].router;

            this.route = this.root.getAttribute('path');
            if (!this.route) {
              throw new Error('No path found for route component.')
            }
            this.router.addRoute(this.route);

            this.handleRouteChange = ({ route }) => {
              const active = this.route === route;
              if (this.active === active) {
                return
              }
              this.active = active;

              // Update context.
              this.update(context);
            };

            this.router.addListener('pushed', this.handleRouteChange);
          },
          update(context) {
            if (this.active) {
              // Dispatch on mounted event.
              const onBeforeMount = getAttribute('onBeforeMount');
              if (onBeforeMount) {
                onBeforeMount.evaluate(context)(this, this.router, this.route);
              }

              const element = document.createElement('div');
              this.root.appendChild(element);
              this.slot.mount(element, {
                slots,
              }, context);

              // Dispatch on mounted event.
              const onMounted = getAttribute('onMounted');
              if (onMounted) {
                onMounted.evaluate(context)(this, this.router, this.route);
              }
            } else {
              // Dispatch on unmounted event.
              const onBeforeUnmount = getAttribute('onBeforeUnmount');
              if (onBeforeUnmount) {
                onBeforeUnmount.evaluate(context)(this, this.router, this.route);
              }

              this.slot.unmount({
                slots,
              }, context, true);

              // Dispatch on unmounted event.
              const onUnmounted = getAttribute('onUnmounted');
              if (onUnmounted) {
                onUnmounted.evaluate(context)(this, this.router, this.route);
              }
            }
          },
          unmount(...args) {
            // Stop listening to router changes
            this.router.removeListener('pushed', this.handleRouteChange);

            // Remove route from router.
            this.router.removeRoute(this.route);

            // Unmount slot.
            this.slot.unmount(...args);
          },
        }
      }
    ),

    'template': null,
    'name': 'riouter-route'
  };

  // Import external modules.

  const defer = window.requestAnimationFrame || window.setTimeout;
  const cancelDefer = window.cancelAnimationFrame || window.clearTimeout;

  var router = {
    'css': null,

    'exports': pure(
      ({ slots, attributes, props }) => {
        const getAttribute = name => attributes && attributes.find(attribute => attribute.name === name);

        const getBase = context => {
          const base = getAttribute('base');
          if (base) {
            return base.evaluate(context)
          }
          return window.location.protocol + '//' + window.location.host
        };

        return {
          // Lifecyle methods.
          mount(element, context) {
            if (!slots || !slots.length) {
              return
            }

            // Set root element.
            this.el = this.root = element;
            this.state = {};
            let updateHistory = getAttribute('updateHistory');
            updateHistory = updateHistory ? (!!updateHistory.evaluate(context)) : false;
            this.router = new Router({
              basePath: getBase(),
              updateHistory: updateHistory,
            });

            // Immidiatly push location.
            this.router.push(window.location.href);

            this.slot = create$d(null, [{
              type: bindingTypes$1.SLOT,
              name: 'default',
            }]);

            // Add this to context.
            context[ROUTER_COMPONENT] = this;

            const onBeforeStart = getAttribute('onBeforeStart');
            if (onBeforeStart) {
              onBeforeStart.evaluate(context)(this, this.router);
            }

            this.slot.mount(this.root, {
              slots,
            }, context);

            const onStarted = getAttribute('onStarted');
            if (onStarted) {
              onStarted.evaluate(context)(this, this.router);
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
          update(context) {
            // Defer update to prevent endless recursion.
            if (this.slot) {
              if (this.deferred) {
                cancelDefer(this.deferred);
              }

              this.deferred = defer(() => {
                this.slot.update({}, this);
              });
            }
          },
        }
      }
    ),

    'template': null,
    'name': 'riouter-router'
  };

  // Import router components.

  var appComponent = {
    'css': null,

    'exports': {
      components: {
        // Router.
        route: route,
        router: router,
      },

      // Router functions.
      onRouterBeforeStart(routerComponent, router) {
        console.log('Router "onBeforeStart" event triggered: ', routerComponent, router);
      },

      onRouterStarted(routerComponent, router) {
        console.log('Router "onStarted" event triggered: ', routerComponent, router);

        // Get navigation elements.
        this.root.querySelectorAll('span[route]').forEach(links => {
          // Listen elements being clicked.
          links.addEventListener('click', (_event) => {
            // Get target with link.
            const target = _event.target.closest('span[route]');
            const targetRoute = target.getAttribute('route');
            // Check if route is set and not already active.
            if (!targetRoute || targetRoute === this.state.activeRoute) {
              return
            }
            // Invoke route change.
            this.state.activeRoute = targetRoute;
            router.push(this.state.activeRoute);
          });
        });

        // Set initial router path to 'a'.
        this.state.activeRoute = 'a';
        router.push(this.state.activeRoute);
      },

      // Route functions.
      onRouteBeforeMount(routeComponent, router, route) {
        console.log('Route "onBeforeMount" event triggered: ', '\n', routeComponent, '\n', router, '\n', route);
      },

      onRouteMounted(routeComponent, router, route) {
        console.log('Route "onMounted" event triggered: ', '\n', routeComponent, '\n', router, '\n', route);
      },

      onRouteBeforeUnmount(routeComponent, router, route) {
        console.log('Route "onBeforeUnmount" event triggered: ', '\n', routeComponent, '\n', router, '\n', route);
      },

      onRouteUnmounted(routeComponent, router, route) {
        console.log('Route "onUnmounted" event triggered: ', '\n', routeComponent, '\n', router, '\n', route);
      }
    },

    'template': function(
      template,
      expressionTypes,
      bindingTypes,
      getComponent
    ) {
      return template(
        '<router expr0="expr0"></router>',
        [
          {
            'type': bindingTypes.TAG,
            'getComponent': getComponent,

            'evaluate': function(
              scope
            ) {
              return 'router';
            },

            'slots': [
              {
                'id': 'default',
                'html': '<nav><span route="a">\n        Link A\n      </span><span route="b">\n        Link B\n      </span><span route="c">\n        Link C\n      </span></nav><main><route expr1="expr1" path="a"></route><route expr2="expr2" path="b"></route><route expr3="expr3" path="c"></route></main>',

                'bindings': [
                  {
                    'type': bindingTypes.TAG,
                    'getComponent': getComponent,

                    'evaluate': function(
                      scope
                    ) {
                      return 'route';
                    },

                    'slots': [
                      {
                        'id': 'default',
                        'html': '\n        Route A\n      ',
                        'bindings': []
                      }
                    ],

                    'attributes': [],
                    'redundantAttribute': 'expr1',
                    'selector': '[expr1]'
                  },
                  {
                    'type': bindingTypes.TAG,
                    'getComponent': getComponent,

                    'evaluate': function(
                      scope
                    ) {
                      return 'route';
                    },

                    'slots': [
                      {
                        'id': 'default',
                        'html': '\n        Route B\n      ',
                        'bindings': []
                      }
                    ],

                    'attributes': [
                      {
                        'type': expressionTypes.EVENT,
                        'name': 'onBeforeMount',

                        'evaluate': function(
                          scope
                        ) {
                          return scope.onRouteBeforeMount;
                        }
                      },
                      {
                        'type': expressionTypes.EVENT,
                        'name': 'onMounted',

                        'evaluate': function(
                          scope
                        ) {
                          return scope.onRouteMounted;
                        }
                      },
                      {
                        'type': expressionTypes.EVENT,
                        'name': 'onBeforeUnmount',

                        'evaluate': function(
                          scope
                        ) {
                          return scope.onRouteBeforeUnmount;
                        }
                      },
                      {
                        'type': expressionTypes.EVENT,
                        'name': 'onUnmounted',

                        'evaluate': function(
                          scope
                        ) {
                          return scope.onRouteUnmounted;
                        }
                      }
                    ],

                    'redundantAttribute': 'expr2',
                    'selector': '[expr2]'
                  },
                  {
                    'type': bindingTypes.TAG,
                    'getComponent': getComponent,

                    'evaluate': function(
                      scope
                    ) {
                      return 'route';
                    },

                    'slots': [
                      {
                        'id': 'default',
                        'html': '\n        Route C\n      ',
                        'bindings': []
                      }
                    ],

                    'attributes': [],
                    'redundantAttribute': 'expr3',
                    'selector': '[expr3]'
                  }
                ]
              }
            ],

            'attributes': [
              {
                'type': expressionTypes.ATTRIBUTE,
                'name': 'base',

                'evaluate': function(
                  scope
                ) {
                  return (window.location.href.slice(-1) === '/') ? window.location.href : (window.location.href + '/');
                }
              },
              {
                'type': expressionTypes.EVENT,
                'name': 'onStarted',

                'evaluate': function(
                  scope
                ) {
                  return scope.onRouterStarted;
                }
              },
              {
                'type': expressionTypes.ATTRIBUTE,
                'name': 'updateHistory',

                'evaluate': function(
                  scope
                ) {
                  return true;
                }
              }
            ],

            'redundantAttribute': 'expr0',
            'selector': '[expr0]'
          }
        ]
      );
    },

    'name': 'app'
  };

  // Get library.

  class App {
    constructor(parent) {
      // Store parent element.
      this._parent = parent;

      // Create root element for app.
      this._element = document.createElement('div');
      this._parent.append(this._element);

      this._component = component(appComponent)(
        this._element, { app: this }
      );
    }
  }

  return App;

})));
//# sourceMappingURL=App.js.map
