import rollupBabel from 'rollup-plugin-babel'
import rollupCommonjs from 'rollup-plugin-commonjs'
import rollupResolve from 'rollup-plugin-node-resolve'
import rollupRiot from 'rollup-plugin-riot'

export default {
  input: 'src/index.js',
  plugins: [
    rollupResolve({
      jsnext: true,
    }),
    rollupCommonjs(),
    rollupRiot({
      ext: 'html',
    }),
    rollupBabel({
      presets: [
        '@riotjs/babel-preset',
      ],
    }),
  ],
}
