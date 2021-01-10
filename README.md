<div align="center">

[![GitHub Repository](https://img.shields.io/static/v1?label=GitHub&message=%20&style=flat-square&color=green&logo=github&maxAge=3600)](https://github.com/redkenrok/webjs-riouter/)
[![License agreement](https://img.shields.io/github/license/redkenrok/webjs-riouter.svg?label=License&style=flat-square&maxAge=86400)](https://github.com/redkenrok/webjs-riouter/blob/master/LICENSE)
[![Open issues on GitHub](https://img.shields.io/github/issues/redkenrok/webjs-riouter.svg?label=Issues&style=flat-square&maxAge=86400)](https://github.com/redkenrok/webjs-riouter/issues)
[![npm @latest version](https://img.shields.io/npm/v/riouter.svg?label=Version&style=flat-square&maxAge=3600)](https://www.npmjs.com/package/riouter)

</div>

<hr/>

# Riouter

[Riot.js](https://github.com/riot) router.

## Differences with [@riot/route](https://github.com/riot/route#readme)

- Riouter can have multiple router instances on a single page. Even a router within a route is possible.
- Riouter can control whether the browsers session history is changed by the router.
- Riouter does not have a `initDomListeners` method. (It is trivial to write a solution yourself, see the `example/src/app.html`'s `onRouterStart` function.)

## Install

```
npm install riouter
```

OR

```
yarn add riouter
```

## Usage

TODO:

## API

### router (component)

TODO:

### route (component)

TODO:

### Router

TODO:

> You can use the router seperatly from the components by importing the `Router.js` file in the root of the project: `import Router from 'riouter/Router.js'`.

## Example

TODO:

## Lazy loading with [@riotjs/lazy](https://github.com/riot/lazy#readme)

The router also supports lazy loading. Simply use [@riotjs/lazy](https://github.com/riot/lazy#readme) as you would otherwise. The components will be lazily loaded once the route they are part of becomes active.
