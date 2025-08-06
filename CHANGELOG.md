# 📦 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
### [0.3.7](https://github.com/nacorga/tracelog-client/compare/v0.3.6...v0.3.7) (2025-08-06)


### Bug Fixes

* configuration management default config handling ([320259c](https://github.com/nacorga/tracelog-client/commit/320259c51b95169eeb2dcf3b0e5fdf6b641f203e))
* enhance config API response validation to include array check ([8221f48](https://github.com/nacorga/tracelog-client/commit/8221f48fe024f54e1161685fe65e73e643d09afa))

### [0.3.6](https://github.com/nacorga/tracelog-client/compare/v0.3.5...v0.3.6) (2025-08-05)

### [0.3.5](https://github.com/nacorga/tracelog-client/compare/v0.3.4...v0.3.5) (2025-08-04)

### [0.3.4](https://github.com/nacorga/tracelog-client/compare/v0.3.3...v0.3.4) (2025-08-01)

### [0.3.3](https://github.com/nacorga/tracelog-client/compare/v0.3.2...v0.3.3) (2025-08-01)


### Bug Fixes

* update page_url assignment to handle excluded routes correctly ([573f56c](https://github.com/nacorga/tracelog-client/commit/573f56cb08559b0990b422e04cda8736c4ff9ef0))

### [0.3.2](https://github.com/nacorga/tracelog-client/compare/v0.3.1...v0.3.2) (2025-08-01)


### Bug Fixes

* correct paths in package.json and disable sourcemaps in vite.config ([b8e97f5](https://github.com/nacorga/tracelog-client/commit/b8e97f58adf49b191dc87640516f579fb4f3547b))

### [0.3.1](https://github.com/nacorga/tracelog-client/compare/v0.3.0...v0.3.1) (2025-08-01)

## [0.3.0](https://github.com/nacorga/tracelog-client/compare/v0.2.6...v0.3.0) (2025-08-01)


### Features

* add configuration validation and normalization utility; update init function to use validated config ([5e751e5](https://github.com/nacorga/tracelog-client/commit/5e751e58f0dd305bf20cb54b9831a9133fadff8a))
* add debounce time constants for click and scroll events ([130775d](https://github.com/nacorga/tracelog-client/commit/130775d5fce3869bd16a00473e34a69b58a06a79))
* add Google Analytics logging for custom events in processAndSend method ([880f831](https://github.com/nacorga/tracelog-client/commit/880f831b03ba7059e290a68485e27e7a9e340f38))
* add scroll tracking functionality with debounce handling ([222fd2d](https://github.com/nacorga/tracelog-client/commit/222fd2dc70e2bdbc8dd0d8dc96e9e29fb2dd6f70))
* enhance app initialization with error handling and state management ([7ecf1ad](https://github.com/nacorga/tracelog-client/commit/7ecf1add3336ef08a3c87f7a9a9e21cb982eb38c))
* enhance page URL tracking and session management; improve error handling in initialization ([ab877a9](https://github.com/nacorga/tracelog-client/commit/ab877a9a821f0f4b69cb4d96c6b200d843622738))
* enhance RC version cleanup functionality; add option to clean all RC versions and improve timestamp sorting ([f376dc7](https://github.com/nacorga/tracelog-client/commit/f376dc7d263cbb76901e32b7f4dd66cb1f10d8bc))
* enhance session management with device detection and UTM parameters integration ([eb8dad5](https://github.com/nacorga/tracelog-client/commit/eb8dad5928956aed20309f0223d798b790248325))
* enhance session management with new listener managers and local storage fallback ([0038c81](https://github.com/nacorga/tracelog-client/commit/0038c814c01b93df041c3e20ab7e1ba9eed91a9a))
* implement app initialization, event tracking, and session management with cleanup methods ([cf645c2](https://github.com/nacorga/tracelog-client/commit/cf645c25ca53f5c23f4a9de7d868f438789152c9))
* implement click tracking handler and enhance session management ([c406963](https://github.com/nacorga/tracelog-client/commit/c40696340bff85f29af7444c3dcf8e1db6e46831))
* implement event tracking and sampling management with page view handling ([7d5d5f4](https://github.com/nacorga/tracelog-client/commit/7d5d5f412ec8111e84a5282c9a2986e6290baa67))
* initial set up ([9a6a3f4](https://github.com/nacorga/tracelog-client/commit/9a6a3f42afdc01b1a7dc6f4b46c121889554daa4))
* integrate Google Analytics for event tracking and add configuration options ([c41cf28](https://github.com/nacorga/tracelog-client/commit/c41cf2822381f31fa0d9c99e93ecf31e6bbf82ca))
* move Google Analytics custom event tracking to processAndSend method ([05f3853](https://github.com/nacorga/tracelog-client/commit/05f3853acee976a936aa5cdf2b5f9f28312a4bef))
* refactor app structure for improved organization ([20be03a](https://github.com/nacorga/tracelog-client/commit/20be03a3cd5c66851ef98d3a6dbe4c4ecc64703e))


### Bug Fixes

* improve error handling in event tracking for uninitialized app ([82aeaf5](https://github.com/nacorga/tracelog-client/commit/82aeaf5eadbf7807cdbbeda66996dd0460d0e666))

### [0.2.6](https://github.com/nacorga/tracelog-client/compare/v0.2.5...v0.2.6) (2025-07-24)


### Bug Fixes

* update tag structure in EventManager to use 'key' instead of 'name' and adjust related types ([d56e050](https://github.com/nacorga/tracelog-client/commit/d56e05004819a231aa1a527b2c0925aa1f2e612e))

### [0.2.5](https://github.com/nacorga/tracelog-client/compare/v0.2.4...v0.2.5) (2025-07-24)


### Bug Fixes

* handle optional chaining in event manager and improve error handling in sanitization functions ([6fead86](https://github.com/nacorga/tracelog-client/commit/6fead86928491b0412dda82cd3ea6191789aaaca))
* make ApiConfig properties optional and improve validation logic ([0f10c74](https://github.com/nacorga/tracelog-client/commit/0f10c7429e157ea54b8fb8194194edda622c9bdc))

### [0.2.4](https://github.com/nacorga/tracelog-client/compare/v0.2.3...v0.2.4) (2025-07-24)


### Bug Fixes

* update error message for invalid configuration to use 'or' instead of 'and/or' ([cbb2c13](https://github.com/nacorga/tracelog-client/commit/cbb2c1389d08ec81403dc7eecdc6d14cf584c680))

### [0.2.3](https://github.com/nacorga/tracelog-client/compare/v0.2.2...v0.2.3) (2025-07-23)

### [0.2.2](https://github.com/nacorga/tracelog-client/compare/v0.2.1...v0.2.2) (2025-07-23)

### [0.2.1](https://github.com/nacorga/tracelog-client/compare/v0.2.0...v0.2.1) (2025-07-22)

## [0.2.0](https://github.com/nacorga/tracelog-client/compare/v0.1.0...v0.2.0) (2025-07-22)


### Features

* add allowHttp configuration option and enhance URL validation ([1ea9220](https://github.com/nacorga/tracelog-client/commit/1ea922018fee1e8808a501b18bf96fcb1f9cad34))
* allow custom event endpoint ([f033f13](https://github.com/nacorga/tracelog-client/commit/f033f13d72937ded2352fb65bbc7a46688d5f12c))
* allow providing api config with custom endpoint ([57d6c9a](https://github.com/nacorga/tracelog-client/commit/57d6c9a30d2b5ad9424bb2d92af1c36b40ecf357))
* anonymize session events on excluded paths ([75d798d](https://github.com/nacorga/tracelog-client/commit/75d798d8cd789d85364309f96b7ecaa89fbc49e3))
* **config:** validate custom API URL protocol ([01bbab8](https://github.com/nacorga/tracelog-client/commit/01bbab8256aec1aeb368170715eaa400e9e62394))
* enhance configuration validation and documentation for custom API settings ([54bfeee](https://github.com/nacorga/tracelog-client/commit/54bfeee333a98ada2cbfba90c2358e43c621d76c))
* enhance tag handling in EventManager and update types for improved structure ([9ad262d](https://github.com/nacorga/tracelog-client/commit/9ad262d7cb7f4a687a918902974d85b28ca991fe))
* handle sessions on excluded routes ([28206e8](https://github.com/nacorga/tracelog-client/commit/28206e8e0baa8ce4004d03582e28ba8018005034))
* implement modular configuration management with fetcher, loader, and validator ([6439013](https://github.com/nacorga/tracelog-client/commit/64390135675fce603017f6e83ce55d3573aa3cbc))
* support dynamic config via customApiConfigUrl ([f434127](https://github.com/nacorga/tracelog-client/commit/f434127d5ae55ed416c9690e5e251fe20c6f59df))

## [0.1.0](https://github.com/nacorga/tracelog-client/compare/v0.0.6...v0.1.0) (2025-07-16)


### Features

* add benchmarking scripts and update README with performance metrics ([f2b0849](https://github.com/nacorga/tracelog-client/commit/f2b08497c279b8b2018585522efe018c45c2e2bc))

### [0.0.6](https://github.com/nacorga/tracelog-client/compare/v0.0.5...v0.0.6) (2025-07-16)


### Bug Fixes

* excludedUrlPaths API config sanitization ([06a2531](https://github.com/nacorga/tracelog-client/commit/06a253169bfb102da6d8ecf6c6ff0c38a7e3c584))

### [0.0.5](https://github.com/nacorga/tracelog-client/compare/v0.0.4...v0.0.5) (2025-07-15)

### 👷‍♂️ Builds

* remove browser build from build:all script ([7393fcb](https://github.com/nacorga/tracelog-client/commit/7393fcb))

### [0.0.4](https://github.com/nacorga/tracelog-client/compare/v0.0.3...v0.0.4) (2025-07-15)

### ✨ Features

* add cleanup for page view handling ([d61a3ee](https://github.com/nacorga/tracelog-client/commit/d61a3ee))
* add version management by importing version from package.json ([6cca685](https://github.com/nacorga/tracelog-client/commit/6cca685))
* increase CLICK_DEBOUNCE_TIME to 500ms and enhance event timestamp handling in EventManager ([b7b48e1](https://github.com/nacorga/tracelog-client/commit/b7b48e1))
* update event manager to track page URL changes during navigation ([4fa9104](https://github.com/nacorga/tracelog-client/commit/4fa9104))

### 🔧 Improvements

* **api**: rename sendCustomEvent to event and update related methods for improved clarity and consistency ([cf82d20](https://github.com/nacorga/tracelog-client/commit/cf82d20))
* **api**: refactor API exports, rename event properties for consistency and improve type definitions ([7e743ba](https://github.com/nacorga/tracelog-client/commit/7e743ba))
* **core**: enhance event deduplication logic in EventManager in unique key generation ([7c36c1e](https://github.com/nacorga/tracelog-client/commit/7c36c1e))
* **core**: improve suppressNextEvent method by adding suppressTimer for better timeout management ([b833421](https://github.com/nacorga/tracelog-client/commit/b833421))
* **config**: update ConfigManager to store configuration directly in the class instance for improved state management ([88e02ec](https://github.com/nacorga/tracelog-client/commit/88e02ec))
* **data**: update clearPersistedEvents and recoverPersistedEvents methods to accept userId parameter ([998f22c](https://github.com/nacorga/tracelog-client/commit/998f22c))
* **data**: simplify DataSender initialization by removing unused userId retrieval and optimizing constructor parameters ([e9c1d39](https://github.com/nacorga/tracelog-client/commit/e9c1d39))
* **data**: modify sendEventsSynchronously to return success status and handle critical event persistence ([a7baa83](https://github.com/nacorga/tracelog-client/commit/a7baa83))
* **tracking**: update initializationPromise handling in Tracking class for improved clarity and consistency ([cd7cf2f](https://github.com/nacorga/tracelog-client/commit/cd7cf2f))
* **storage**: extract SafeLocalStorage ([b274f24](https://github.com/nacorga/tracelog-client/commit/b274f24))

### 🐛 Bug Fixes

* add error handling and retry scheduling for failed event sending in DataSender ([ceb2509](https://github.com/nacorga/tracelog-client/commit/ceb2509))
* add error handling for initialization promise in Tracking class ([ea4cd89](https://github.com/nacorga/tracelog-client/commit/ea4cd89))
* avoid double serialization in SafeLocalStorage ([dfdbe18](https://github.com/nacorga/tracelog-client/commit/dfdbe18))
* ensure null value is handled during serialization in SafeLocalStorage ([6c51148](https://github.com/nacorga/tracelog-client/commit/6c51148))
* ensure proper timeout handling in fetchConfig method of ConfigManager ([b2fcbc4](https://github.com/nacorga/tracelog-client/commit/b2fcbc4))
* improve host validation in ConfigManager to ensure proper hostname structure ([5aeaafd](https://github.com/nacorga/tracelog-client/commit/5aeaafd))
* update API configuration keys ([c589939](https://github.com/nacorga/tracelog-client/commit/c589939))
* update extractTrackingData to return undefined instead of throwing an error for missing name attribute ([0991a91](https://github.com/nacorga/tracelog-client/commit/0991a91))
* update RC version generation to use workflow run count instead of run number ([919c7a0](https://github.com/nacorga/tracelog-client/commit/919c7a0))
* use sanitized global metadata ([b769143](https://github.com/nacorga/tracelog-client/commit/b769143))

### 👷‍♂️ Builds

* **package**: include both ESM and CJS directories, modify tsconfig.json to exclude tests, and disable sourcemaps in vite.config.mjs ([d3445cb](https://github.com/nacorga/tracelog-client/commit/d3445cb))
* **ci**: update .versionrc.json for correct repository links and improve GitHub Actions workflow for release management ([d89756e](https://github.com/nacorga/tracelog-client/commit/d89756e))
* **ci**: remove release check step from GitHub Actions workflow ([28b4560](https://github.com/nacorga/tracelog-client/commit/28b4560))

### [0.0.3](https://github.com/nacorga/tracelog-client/compare/v0.0.2...v0.0.3) (2025-07-15)

### ✨ Features

* add cleanup for page view handling ([d61a3ee](https://github.com/nacorga/tracelog-client/commit/d61a3ee9edb715ffbe095be6c1315dce35a114cf))
* add version management by importing version from package.json ([6cca685](https://github.com/nacorga/tracelog-client/commit/6cca685a3d5057382af5e706733a43fd8325d682))
* increase CLICK_DEBOUNCE_TIME to 500ms and enhance event timestamp handling in EventManager ([b7b48e1](https://github.com/nacorga/tracelog-client/commit/b7b48e1c1ce4c005e33cc8d872e8f6b28b5a438f))
* update event manager to track page URL changes during navigation ([4fa9104](https://github.com/nacorga/tracelog-client/commit/4fa9104c31d5cb930cdda548c47ea5d06647eed3))

### 🐛 Bug Fixes

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

### [0.0.2](https://github.com/nacorga/tracelog-client/compare/v0.0.1...v0.0.2) (2025-07-14)

### 💥 Breaking Changes

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

### ✨ Features

* **api**: refactor public API structure and improve module organization ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))
* **tags**: enhance tag manager with simplified condition logic and improved element matching ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))
* **events**: simplify click event data structure with cleaner property names ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))

### 🔧 Improvements

* **scripts**: translate comments and console messages in rc-manager.js to English for consistency ([d9f05ae](https://github.com/nacorga/tracelog-client/commit/d9f05ae997b693df9c38cb20aa5406474e6b081c))

### 🐛 Bug Fixes

* **config**: improve error handling and remove unnecessary API key references ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))
* **types**: update TagConfig and error types for better consistency ([0eb7fab](https://github.com/nacorga/tracelog-client/commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))

### [0.0.1](https://github.com/nacorga/tracelog-client/releases/tag/v0.0.1) (2025-07-14)

### ✨ Features

* add Playwright for end-to-end testing and implement various test cases ([a9c5f84](https://github.com/nacorga/tracelog-client/commit/a9c5f849cf3f3fc44db9ecdd2e05dcb79f2bbd89))
* app works ([8fbc555](https://github.com/nacorga/tracelog-client/commit/8fbc555735256c9f8e9efb6f289eba072167c8b3))
* configure husky v9 with lint-staged and commitlint ([ddcbc25](https://github.com/nacorga/tracelog-client/commit/ddcbc254eae22eb3053a4ed063ebb462f4042b81))
* enable mobile testing in Playwright and enhance event tagging functionality ([d8c1e85](https://github.com/nacorga/tracelog-client/commit/d8c1e850f727a30895f4a9fc7e87db698e06dd39))
* implement comprehensive tracking system with demo mode support and new Vite build setup ([7750c14](https://github.com/nacorga/tracelog-client/commit/7750c14b0595ab33e80ccc5798032309d3c18234))
* improve tracking and configuration management with scroll suppression and URL handling ([a9fb3e7](https://github.com/nacorga/tracelog-client/commit/a9fb3e7366676261c9eaa7064df392ef904ce106))

### 🐛 Bug Fixes

* remove click listener on cleanup ([cdf9a69](https://github.com/nacorga/tracelog-client/commit/cdf9a6966974a30f687147906aca959db88b43ec))
* update paths in package.json to point to the correct source files ([bda2da9](https://github.com/nacorga/tracelog-client/commit/bda2da9a5ed7e6f362bd18accd0ebaa5823b5d8b))
* update version in package.json, enhance scroll handling for mobile compatibility, and add extensive session state management tests ([1d8fb5e](https://github.com/nacorga/tracelog-client/commit/1d8fb5e8ede8554fda2908cc5dfb0abf2996a7c0))
