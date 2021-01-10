import { IS_PURE_SYMBOL } from '@riotjs/util/constants.js'

/**
 * Marks given component as pure component. Is a copy of Riot's own pure function.
 * Because I don't want to import the entire library for just one function.
 * @param {Function|Object} component Function to add pure symbol to.
 * @returns {Function|Object} Component marked as pure.
 */
const pure = function (component) {
  component[IS_PURE_SYMBOL] = true
  return component
}

export default pure
