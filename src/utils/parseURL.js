/**
 * Shorthand for parsing URL safely whether in the browser or in NodeJS.
 * @param  {...any} args Arguments for the URL parser.
 * @returns {URL} URL instance.
 */
export default function(...args) {
  if (typeof window !== 'undefined') {
    return new URL(...args)
  }
  return require('url').url(...args)
}
