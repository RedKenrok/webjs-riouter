class ObjectUtils {
  /**
   * Deeply assign a series of objects properties together.
   * @param {Object} target Target object to assign onto.
   * @param  {...Object} sources Sources to assign with.
   * @returns {Object} Target object with sources values assigned.
   */
  static deepAssign (target, ...sources) {
    if (!sources.length) {
      return target
    }
    const source = sources.shift()

    if (ObjectUtils.isObject(target) && ObjectUtils.isObject(source)) {
      for (const key in source) {
        if (ObjectUtils.isObject(source[key])) {
          if (!target[key]) {
            Object.assign(target, {
              [key]: {},
            })
          }
          ObjectUtils.deepAssign(target[key], source[key])
        } else {
          Object.assign(target, {
            [key]: source[key],
          })
        }
      }
    }

    return ObjectUtils.deepAssign(target, ...sources)
  }

  /**
   * Check whether the value is an object.
   * @param {Any} value Value of unknown type.
   * @returns {Boolean} Whether the value is an object.
   */
  static isObject (value) {
    return (value && typeof value === 'object' && !Array.isArray(value))
  }
}

export default ObjectUtils
