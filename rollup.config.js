// Package.json.
import _package from './package.json'
// Rollup plugins.
import rollupBabel from '@rollup/plugin-babel'
import rollupCommonJS from '@rollup/plugin-commonjs'
import rollupResolve from '@rollup/plugin-node-resolve'
import rollupRiot from 'rollup-plugin-riot'
import { terser as rollupTerser } from 'rollup-plugin-terser'

/**
 * Check whether the value is an object.
 * @param {Any} value Value of unknown type.
 * @returns Whether the value is an object.
 */
const isObject = function (value) {
  return (value && typeof value === 'object' && !Array.isArray(value))
}

/**
 * Deeply assign a series of objects properties together.
 * @param {Object} target Target object to merge to.
 * @param  {...Object} sources Objects to merge into the target.
 */
const deepAssign = function (target, ...sources) {
  if (!sources.length) {
    return target
  }
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, {
            [key]: {},
          })
        }
        deepAssign(target[key], source[key])
      } else if (Array.isArray(source[key])) {
        target[key] = source[key].map((value) => {
          if (isObject(value)) {
            return deepAssign({}, value)
          }
          return value
        })
      } else {
        Object.assign(target, {
          [key]: source[key],
        })
      }
    }
  }

  return deepAssign(target, ...sources)
}

// File extensions to potentially process.
const extensions = [
  '.js',
]
// Create config for each path.
const configFormats = process.env.NODE_ENV === 'production' ? ['amd', 'esm', 'iife', 'umd'] : ['umd']
// Create configs to return.
const configs = []
const baseConfig = {
  input: _package.main,
  output: {
    file: _package.browser,
    inlineDynamicImports: true,
    name: _package.packagename,
    sourcemap: true,
  },
  plugins: [
    rollupResolve({
      extensions: extensions,
      jsnext: true,
    }),
    rollupCommonJS(),
    rollupRiot({
      ext: 'html',
    }),
    rollupBabel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      extensions: extensions,
      plugins: [
        '@babel/plugin-transform-runtime',
      ],
      presets: [
        '@riotjs/babel-preset',
      ],
    }),
  ],
}
configFormats.forEach(_format => {
  // Duplicate base config.
  const newConfig = deepAssign({}, baseConfig)

  // Set format to new config.
  newConfig.output.format = _format

  // Create destination path based of format.
  let destination = newConfig.output.file
  destination = destination.split('.')
  destination.splice(destination.length - 1, 0, _format)
  newConfig.output.file = destination.join('.')

  // Add to config list.
  configs.push(newConfig)
})

// Create configs for build.
if (process.env.NODE_ENV === 'production') {
  configs.forEach(_config => {
    const newConfig = deepAssign({}, _config)

    // Disable sourcemaps.
    newConfig.output.sourcemap = false

    // Add minification plugin.
    newConfig.plugins.push(rollupTerser())

    // Create destination path based of format.
    let destination = newConfig.output.file
    destination = destination.split('.')
    destination.splice(destination.length - 1, 0, 'min')
    newConfig.output.file = destination.join('.')

    // Add to config list.
    configs.push(newConfig)
  })
}

module.exports = configs
