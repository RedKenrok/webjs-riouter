// Rollup plugins.
import rollupCommonJS from '@rollup/plugin-commonjs'
import rollupResolve from '@rollup/plugin-node-resolve'
import rollupRiot from 'rollup-plugin-riot'

const config = {
  input: './example/src/App.js',
  output: {
    file: './example/dst/app.js',
    format: 'umd',
    inlineDynamicImports: true,
    name: 'App',
    sourcemap: true,
  },
  plugins: [
    rollupResolve({
      extensions: [
        '.js',
      ],
      jsnext: true,
    }),
    rollupCommonJS(),
    rollupRiot({
      ext: 'html',
    }),
  ],
}

module.exports = config
