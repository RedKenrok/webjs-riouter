import { IS_PURE_SYMBOL } from '@riotjs/util/constants.js'

const pure = function (func) {
  func[IS_PURE_SYMBOL] = true
  return func
}

export default pure
