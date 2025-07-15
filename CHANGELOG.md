# 📦 Changelog

All notable changes to this project will be documented in this file.

### 0.0.3 (2025-07-15)


### Features

* add cleanup for page view handling ([d61a3ee](https://github.com/nacorga/tracelog-client/commit/d61a3ee9edb715ffbe095be6c1315dce35a114cf))
* add version management by importing version from package.json ([6cca685](https://github.com/nacorga/tracelog-client/commit/6cca685a3d5057382af5e706733a43fd8325d682))
* increase CLICK_DEBOUNCE_TIME to 500ms and enhance event timestamp handling in EventManager ([b7b48e1](https://github.com/nacorga/tracelog-client/commit/b7b48e1c1ce4c005e33cc8d872e8f6b28b5a438f))
* update event manager to track page URL changes during navigation ([4fa9104](https://github.com/nacorga/tracelog-client/commit/4fa9104c31d5cb930cdda548c47ea5d06647eed3))


### Bug Fixes

* add error handling and retry scheduling for failed event sending in DataSender ([ceb2509](https://github.com/nacorga/tracelog-client/commit/ceb250939ad22f2a6946e71b415427faf0b67748))
* add error handling for initialization promise in Tracking class ([ea4cd89](https://github.com/nacorga/tracelog-client/commit/ea4cd894f821c88d2fd56f38ae9f3f481a512d0d))
* avoid double serialization in SafeLocalStorage ([dfdbe18](https://github.com/nacorga/tracelog-client/commit/dfdbe183afa618c41931de7abe468f683ab8dc83))
* ensure null value is handled during serialization in SafeLocalStorage ([6c51148](https://github.com/nacorga/tracelog-client/commit/6c5114837cede574435cb37ec3a6a0df84482523))
* ensure proper timeout handling in fetchConfig method of ConfigManager ([b2fcbc4](https://github.com/nacorga/tracelog-client/commit/b2fcbc49c281d826a0a61b305d67eb7a9927a6ee))
* improve host validation in ConfigManager to ensure proper hostname structure ([5aeaafd](https://github.com/nacorga/tracelog-client/commit/5aeaafdf8eb6b042cb05ad206d557161f068f940))
* update API configuration keys ([c589939](https://github.com/nacorga/tracelog-client/commit/c5899396b99fb8d684ed0747dc2c76bf84aa9d9c))
* update extractTrackingData to return undefined instead of throwing an error for missing name attribute ([0991a91](https://github.com/nacorga/tracelog-client/commit/0991a915005eeb396d20a6b82aedae80bf7ab668))
* update RC version generation to use workflow run count instead of run number ([919c7a0](https://github.com/nacorga/tracelog-client/commit/919c7a0a2ba52b1c309ee94c87655dcd1bcb6dc9))
* use sanitized global metadata ([b769143](https://github.com/nacorga/tracelog-client/commit/b7691434c5990f5e6bc1f879e4f5f9e33ee5f078))

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
