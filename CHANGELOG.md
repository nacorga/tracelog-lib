# 📦 Changelog

All notable changes to this project will be documented in this file.
### 0.0.3 (2025-07-15)

### 0.0.2 (2025-07-14)


### Features

* **api**: refactor public API structure and improve module organization ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))
* **tags**: enhance tag manager with simplified condition logic and improved element matching ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))
* **events**: simplify click event data structure with cleaner property names ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))


### Improvements

* **scripts**: translate comments and console messages in rc-manager.js to English for consistency ([d9f05ae](https://github.com/nacorga/tracelog-client/commit/d9f05ae997b693df9c38cb20aa5406474e6b081c))


### Breaking Changes

* **events**: renamed click event properties for consistency:
  - `elementTag` → `tag`
  - `elementId` → `id` 
  - `elementClass` → `class`
  - `elementText` → `text`
  - `elementHref` → `href`
  - `elementTitle` → `title`
  - `elementAlt` → `alt`
  - `elementRole` → `role`
  - `elementAriaLabel` → `ariaLabel`
  - `elementDataAttributes` → `dataAttributes`


### Bug Fixes

* **config**: improve error handling and remove unnecessary API key references ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))
* **types**: update TagConfig and error types for better consistency ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))

### 0.0.1 (2025-07-14)


### Features

* add Playwright for end-to-end testing and implement various test cases ([a9c5f84](https://github.com/nacorga/tracelog-client/commit/a9c5f849cf3f3fc44db9ecdd2e05dcb79f2bbd89))
* app works ([8fbc555](https://github.com/nacorga/tracelog-client/commit/8fbc555735256c9f8e9efb6f289eba072167c8b3))
* configure husky v9 with lint-staged and commitlint ([ddcbc25](https://github.com/nacorga/tracelog-client/commit/ddcbc254eae22eb3053a4ed063ebb462f4042b81))
* enable mobile testing in Playwright and enhance event tagging functionality ([d8c1e85](https://github.com/nacorga/tracelog-client/commit/d8c1e850f727a30895f4a9fc7e87db698e06dd39))
* implement comprehensive tracking system with demo mode support and new Vite build setup ([7750c14](https://github.com/nacorga/tracelog-client/commit/7750c14b0595ab33e80ccc5798032309d3c18234))
* improve tracking and configuration management with scroll suppression and URL handling ([a9fb3e7](https://github.com/nacorga/tracelog-client/commit/a9fb3e7366676261c9eaa7064df392ef904ce106))


### Bug Fixes

* remove click listener on cleanup ([cdf9a69](https://github.com/nacorga/tracelog-client/commit/cdf9a6966974a30f687147906aca959db88b43ec))
* update paths in package.json to point to the correct source files ([bda2da9](https://github.com/nacorga/tracelog-client/commit/bda2da9a5ed7e6f362bd18accd0ebaa5823b5d8b))
* update version in package.json, enhance scroll handling for mobile compatibility, and add extensive session state management tests ([1d8fb5e](https://github.com/nacorga/tracelog-client/commit/1d8fb5e8ede8554fda2908cc5dfb0abf2996a7c0))
