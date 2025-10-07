# Changelog

## [0.6.5] - 2025-10-07

### 🐛 Bug Fixes

- Prevent tags pointing to wrong commits in release workflow
- Automate package-lock.json updates in release process

### 📝 Release Notes

- Skipped versions 0.6.2 and 0.6.4 due to tag synchronization issues
- Version 0.6.4 exists on NPM but with incorrect git metadata

## [0.6.3] - 2025-10-07

### 🐛 Bug Fixes

- Resolve release workflow tag duplication issue ([f9c8fb1](../../commit/f9c8fb1918b9d9ba477f8a54de911659b98c6502))
- Ensure HTMLElement is defined in both handlers and test setup to prevent ReferenceError in CI environments ([b5f8ae6](../../commit/b5f8ae6fddc46de21d1a47ba7d6ad48f529e09f2))

### ♻️ Refactoring

- Rename apiUrl to collectApiUrl in configuration and update related references ([f523f53](../../commit/f523f535967f68a244a370b39b9393c7299aa114))
- Improve event management by implementing pending events buffer and rate limiting ([675fe31](../../commit/675fe31c071ac21961d680bcae73bf2d095a10a1))
- Update configuration for HTTP allowance in API ([a700076](../../commit/a700076badb72976ebb5ed1fe668f687b89d3d0b))

### 🔧 Other Changes

- Update package-lock.json to version 0.6.2 ([9496afd](../../commit/9496afd68a185b4b74690617c62bbbb13c218df1))
- Expand lint-staged to cover scripts and config files ([d1400cb](../../commit/d1400cbfd5d611387c33a510b7176122e49c57da))
- Update docs tracelog.js build [skip ci] ([4049bdb](../../commit/4049bdb46d730f50ad5317cad3b43a9951e5f859))
- Merge pull request #21 from nacorga/release/20251007.3 ([419f0b1](../../commit/419f0b184e88895697824b3675a31e5db33df2f0))
- Update docs tracelog.js build [skip ci] ([efd9585](../../commit/efd95850ef0661470d592d1174da0842918565d9))
- Merge pull request #20 from nacorga/release/20251007.2 ([6e00ee4](../../commit/6e00ee4f72c865d8ea13429d2aaa678b7c5f8535))
- Update .gitignore to include CLAUDE.md ([c31e11d](../../commit/c31e11da8c65e7aef46574341ce109befe43dcb6))
- Migrate playground to docs, update file structure and references for TraceLog demo ([18ae09d](../../commit/18ae09d30c97cb7f0a408ef0be4bea4f14cff301))
- Update playground tracelog.js build [skip ci] ([1e3ae8b](../../commit/1e3ae8b9f9650e4a2a5fcf6a403ff540ec2cd46b))
- Merge pull request #19 from nacorga/release/20251007.1 ([4e2c1af](../../commit/4e2c1afd2e4768dd0fdaa8c1802f0ba6d52064ec))
- Update .gitignore, add GitHub Actions workflow for demo deployment ([d977796](../../commit/d977796b85a8e293c54285444c49de32aa3fbab1))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- GitHub Action
- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.6.0...v0.6.3


## [0.6.2] - 2025-10-07

### 🐛 Fixes

- Fix release workflow tag duplication issue
- Update release script to prevent GitHub Actions tag conflicts
- Remove tag creation from release script (handled by GitHub Actions)



















## [0.6.0] - 2025-10-06

### ✨ Features

- Enhance event listener management with buffering for uninitialized states ([06e027f](../../commit/06e027f09813678792a0ff7aa32f8d6388b2b7fd))
- Implement event buffering and flushing mechanism for uninitialized sessions ([ef2ef1b](../../commit/ef2ef1bd4085b73ed970382e5e97dff2934756c3))
- Implement unique event ID generation for enhanced event tracking ([b4ac157](../../commit/b4ac1574c55befd83592dba788602976a725be82))

### 🐛 Bug Fixes

- Update QA mode URL parameter ([2623bb9](../../commit/2623bb99258a3a56f06f16fd5aed0f924e8be300))

### 🧪 Tests

- Session ID management by parameterizing storage key in cross-tab session sync tests ([d5ac293](../../commit/d5ac293424e4db76c64ec2ece0c1f00a28d4e694))
- Integration tests for API emitters and app lifecycle ([1ef8bc0](../../commit/1ef8bc08c1580c153733f169703614ce1fe129ad))
- Add comprehensive unit tests for public API, SenderManager edge cases, and Emitter utility ([858716e](../../commit/858716e815f3d3e1566f44399555e09b28008947))

### ♻️ Refactoring

- Update HTML data attributes and improve storage key management ([e885fe1](../../commit/e885fe1decbaffca24ea88b91258399644db26bf))
- Optimize localStorage cleanup process for TraceLog data ([c2f45db](../../commit/c2f45dbab2ef20bc25e5a01b25e31bb94ddbd03c))
- Enhance event tracking library with client-only architecture ([374f378](../../commit/374f378d7eed1c72e275f5ae408e41857d20bc15))
- Add validation for nested objects in arrays and update type guard utilities ([2d72fed](../../commit/2d72fed61e01ff3d085da204e51f899a1c21e240))
- Emit custom events in QA mode and update test cases for event capturing ([10384fa](../../commit/10384fab1f9b33090f925d27e197c0c408370b00))
- Replace debug logging with unified log utility and enhance error messages throughout the codebase ([aa94683](../../commit/aa9468330f22104fcb1936e899eb24f6e3acd6de))
- Update session management to use unified storage methods and improve event handling in SenderManager ([d017dbf](../../commit/d017dbf4976a2bd005e64458bc04d3c9bcf2f5c4))
- Update TraceLog initialization to support local-only mode and remove project ID requirement ([9c29b8e](../../commit/9c29b8eacb965ef181545859f7b5a36ba411958f))
- Simplify API URL handling in SenderManager ([f9fcdb0](../../commit/f9fcdb041a74bc5a5113acab89a0611d69146fbc))
- Enhance session and storage management by implementing sessionStorage support and updating mode handling ([d8a4a9a](../../commit/d8a4a9a2242e06fd580af13efeb9fe2803a56623))
- Remove excludedUrlPaths from Config ([c9e5390](../../commit/c9e5390fa20dace0bf1cb9172e35560e24513af6))
- Remove unused types and constants, update exports in public API ([3c64d1c](../../commit/3c64d1cd2b31c9009372b66b4eb655f33dfce5f4))
- Remove unused managers and update constants ([cf9263c](../../commit/cf9263cff2e865ace6e1a383421dc4fb02f7194e))
- Update configuration handling by renaming AppConfig to Config and removing unused managers ([2683b78](../../commit/2683b78bac08633df7e343be3794b6d0a2f4ed93))

### 🔧 Other Changes

- Merge pull request #18 from nacorga/release/20251006.1 ([57499b4](../../commit/57499b439c60b7c81575a8aa8d4aa74e657a1ec6))
- Merge pull request #17 from nacorga/feature/open-source ([c472313](../../commit/c4723136560bf7c90305d970a2612acf956cbfc6))
- Remove AGENTS.md file containing project instructions and guidelines ([0c3d64e](../../commit/0c3d64eeb2230e7a065a9782b57ef38267af05a1))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.5.5...v0.6.0


## [0.5.5] - 2025-10-03

### 🔧 Other Changes

- Simplify Vite configuration by removing redundant check for 'tracelog' global object ([7a17c4f](../../commit/7a17c4fa23293d2653e7cbf35255d0e551fe8208))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.5.4...v0.5.5


## [0.5.4] - 2025-10-03

### 🐛 Bug Fixes

- Update README and Vite configuration to ensure consistent usage of 'tracelog' global object ([53ca8c1](../../commit/53ca8c1c54113c40f05c9649562fb9b7ec13000d))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.5.3...v0.5.4


## [0.5.3] - 2025-10-03

### 🐛 Bug Fixes

- Update README and Vite configuration to reflect global object changes from 'tracelog' to 'TraceLog.tracelog' ([65f24cb](../../commit/65f24cb094823b453a62cc236b69c6df44d0b48d))

### 🔧 Other Changes

- Merge pull request #16 from nacorga/hotfix/20251003.1 ([6039f7c](../../commit/6039f7c6f64729fe449d3c7c509d1e206d5bb279))
- Correct comment in Vite configuration to accurately reflect structure of the global TraceLog object ([b076210](../../commit/b0762104cfecf9171af92fd53e75d414a13de6c9))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.5.2...v0.5.3


## [0.5.2] - 2025-10-03

### 🔧 Other Changes

- Merge pull request #15 from nacorga/release/20251003.2 ([411544e](../../commit/411544e5ca91e57978ee5da8185393132d413f16))
- Add setup files for Vitest integration tests ([bf26178](../../commit/bf2617867327cde5c887ec9be63e03f4f1968f56))
- Correct formatting of TTFB threshold description in performance constants ([dcd7134](../../commit/dcd713435db6e5679c0cce84229d1b8395823f9f))
- Update Vite configuration and refine TTFB threshold description in performance constants ([7d8d96e](../../commit/7d8d96ecb5d4d2b8a558b2652f2ca37d97910b6b))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.5.1...v0.5.2


## [0.5.1] - 2025-10-03

### 🔧 Other Changes

- Merge pull request #14 from nacorga/release/20251003.1 ([ff9d04d](../../commit/ff9d04d155ef256b34507e03b8569c89467fb809))
- Update playground setup and test commands to use ESM bundle ([53a10b4](../../commit/53a10b4d27523acf60d45dd73b9aef02c9ec362b))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.5.0...v0.5.1


## [0.5.0] - 2025-10-02

### ✨ Features

- Add global Vitest setup and comprehensive unit tests for listener managers and click handler ([8387829](../../commit/8387829a8392aa29bce5cddcb7634f5846678f0a))

### 🐛 Bug Fixes

- Enhance event metadata handling, and improve session management logic ([c41010e](../../commit/c41010e8450ae1deb9be900b4a7f172f1897950a))

### 🧪 Tests

- Add comprehensive integration and unit tests for API methods ([7f5d1e7](../../commit/7f5d1e7df5554044e8381c8d7364b995d8884589))

### ♻️ Refactoring

- Simplify send logic in SenderManager, enhance payload with metadata for sendBeacon fallback ([a335b92](../../commit/a335b921e6d396fd40fc481ea3969762f81d7d0c))
- Update localhost handling in API and config managers, enhance metadata validation tests ([95117b6](../../commit/95117b6957fa5dee624b52f1a8314170ffe8d0dc))
- Improve event handling and session management, enforce hard limit on tracked errors ([a1ebc1e](../../commit/a1ebc1e7a7183127bdbaa14f6087d8f89166b9a3))

### 🔧 Other Changes

- Merge pull request #13 from nacorga/release/20251002.1 ([8d9913e](../../commit/8d9913ef2283b9e2fcfe765748beda2453947654))
- Update Vitest coverage configuration to include json-summary reporter and increase coverage thresholds ([6263fd5](../../commit/6263fd5d6e0b75dee1d2382e5b7ff13a7c297f40))
- Update CI workflows ([a6c53ce](../../commit/a6c53ce8099c9bc89544cd4f5a838c1b52d12a9d))
- Merge pull request #12 from nacorga/feature/warranty ([94a54b2](../../commit/94a54b260dae728cdf06e65445ec15ceb6d25672))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.4.1...v0.5.0


## [0.4.1] - 2025-09-30

### 🐛 Bug Fixes

- Session start deduplication logic and add corresponding tests ([55832b1](../../commit/55832b1ccf8d3fb1cc2bd7ead83458bd516143f5))

### 🔧 Other Changes

- Merge pull request #11 from nacorga/hotfix/20250930.1 ([a74d00b](../../commit/a74d00bf9f74168340cc95a012d23bdd06d9cae6))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.4.0...v0.4.1


## [0.4.0] - 2025-09-29

### ✨ Features

- Enhance scroll tracking with dynamic container support and add new event types ([24d2afd](../../commit/24d2afd0802b30645d20e7dbf0218a881d100d42))

### 🔧 Other Changes

- Merge pull request #10 from nacorga/release/20250930.1 ([d10c356](../../commit/d10c356e9e90cdf26ea098bbd98de921f32ada55))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.3.0...v0.4.0


## [0.3.0] - 2025-09-29

### ✨ Features

- Add flag to disable TraceLog initialization and update README ([efa1a1a](../../commit/efa1a1a8fd2172966a92523d23ba8f9e88bd6bd2))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.2.2...v0.3.0


## [0.2.2] - 2025-09-29

### 🔧 Other Changes

- Add special page URLs constants for improved routing management ([45313cb](../../commit/45313cb7bc04f9153874b408a631a5de59d6d28f))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.2.1...v0.2.2


## [0.2.1] - 2025-09-29

### 🔧 Other Changes

- Update testing framework from Jest to Vitest and improve test patterns ([99a0a21](../../commit/99a0a21421e3ba2f47602d99cb3187af94ca76c4))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.2.0...v0.2.1


## [0.2.0] - 2025-09-29

### ✨ Features

- Implement configuration normalization to ensure consistent sampling rate and preserve excluded URL paths ([23f195d](../../commit/23f195d96a7078088eb7079a420f480cb3f54d15))
- Ensure sampling rate validation and critical event handling ([aafce25](../../commit/aafce25012318e4c26e1a0d17e13d75157fc5d28))
- Add session storage and broadcast channel support and enhance event payload handling ([5433727](../../commit/5433727d31407f031c5ee53b7ca704cd007c1368))
- Enhance event handling, scroll tracking and emitter for event management ([2b29885](../../commit/2b2988538881043fa6ce2c5507d71697302aac26))
- Enhance session management with error handling, and implement integration tests ([eab718e](../../commit/eab718e257f173d7a8b437e275c11f3d2aee454e))
- User journey testing with realistic E2E scenarios, improve event validation, and add new test configurations ([fda8fec](../../commit/fda8fec5b587c5d23741715b1e44f8dff1802d49))
- Update testing framework with integration tests, enhance configuration, and improve documentation ([06ba921](../../commit/06ba9214f89146745e4ed9131dc5dcb3d14fb2ff))
- Add comprehensive E2E testing plan and enhance TraceLog documentation ([7563e56](../../commit/7563e567aa5f133072285a2b3dc2aca90a142512))
- Add type-check scripts and improve playground navigation for testing ([21f6916](../../commit/21f6916822d1f3b540d95a1c9cc95acce2998697))
- Enable inline dynamic imports in Vite config and simplify event monitoring logic in playground ([bc80563](../../commit/bc8056331691354927c441c7eecd26c0a12ba854))
- Phase 1 ([42e6c06](../../commit/42e6c06f85823387cdb84b5b20999f4187f204f2))
- Update playground documentation and enhance TraceLog initialization examples ([91644ee](../../commit/91644ee2b08c17d8f253bf11430096c095d3a4db))
- Enhance initialization process with timeout handling and validation checks in API and App classes ([d8ee442](../../commit/d8ee442bbe335cf1d74027f8b39694a27e64b808))
- Add demo page and enhance navigation structure in playground ([c1f0fb9](../../commit/c1f0fb924cf27c55cbb03ba0f70b7863ba67597c))
- Add error recovery statistics and system recovery methods in API and EventManager ([5edb3cc](../../commit/5edb3cc9f6fa8c4bda3ab327ead47f5c386d984a))
- Implement fetchWithTimeout utility and integrate it into ConfigManager and SenderManager ([15ec61b](../../commit/15ec61be4db5942b52da17531c1c515e8dfc957c))
- Add centralized backoff configuration and implement BackoffManager for consistent retry logic ([0a9c7ee](../../commit/0a9c7eec892d7894b2e05b0b5a2e9a21edf1d17b))
- Implement event recovery and enhance error handling in EventManager and SenderManager ([c403de3](../../commit/c403de3cccdb6a060043cb818b81a4dd3a915bf7))
- Add MAX_RETRY_ATTEMPTS constant and implement retry logic in SenderManager ([d64ef73](../../commit/d64ef73733d74dc9763b55111855424453742b48))

### 🧪 Tests

- Enhance session management tests with excluded URL scenarios and default sampling behavior ([f9140ec](../../commit/f9140ec5f5938f1077fe47de4db5a5f167423399))
- Implement comprehensive E2E tests for user flows ([c3a5ed0](../../commit/c3a5ed04dae2ab9ef9584c2fd3ed68e85295d180))

### ♻️ Refactoring

- Add comprehensive performance and data protection constants for enhanced analytics ([d701a44](../../commit/d701a4407d43c2c982d7f67959301d85ab4ebabc))
- Centralize error handling constants and improve performance monitoring configuration ([d50bcbe](../../commit/d50bcbe9239fc6354a6444671662c3c8b2871543))
- Enhance floating monitor UI and improve event handling in TraceLog integration ([5f40c9c](../../commit/5f40c9cc4e3205e2a56621db6c0617bc8a1c10e4))
- Update error handling structure and improve event tracking in handlers ([e4fd0e0](../../commit/e4fd0e04a0779469fe401a3a8efad3a73fb1f6f4))
- Streamline type exports in app.types and public-api for improved organization ([f6a22c6](../../commit/f6a22c6e2ded3ba52ed1de2ea61815e85ed300d3))
- Update documentation and examples to use 'tracelog' namespace for API methods ([c900329](../../commit/c900329a62602c143a8fc0495ed7b555a4a551db))
- Update TraceLog API and streamline type exports for better organization ([4351e9d](../../commit/4351e9d6f8ca870496ba316c5e23d94508a850c0))
- Improve app initialization resilience and error handling during setup ([1603ad8](../../commit/1603ad8cb7a18324e8e2bf09f1d64f60fc489a82))
- Update API and configuration types ([a68d86a](../../commit/a68d86aa7152ea00ae0671112f06d15a8e77d4a0))
- Remove debug logging statements from various handlers and managers to streamline code ([3e55ff0](../../commit/3e55ff0f94ebbdaf7a6a85af3339350b4cede53b))
- Remove unused constants, simplify performance handler, and enhance type definitions ([b5e4920](../../commit/b5e4920d99d527593d5c968feedcef82e0cf4ca0))
- Streamline Google Analytics integration, enhance error handling, and remove unused code ([1a08659](../../commit/1a086592e1798de6867ecfa150b57f9deab6770f))
- Introduce BaseInputListenerManager to reduce code duplication in input listener managers ([19d2776](../../commit/19d2776b869f1db4d137beef774b2506e1d4a32b))
- Optimize async methods to synchronous in App class, improve API URL generation, and remove unused constants ([31817a3](../../commit/31817a330b5d1f94954f2f388e8a902d44b82291))
- Simplify size property declaration in setup tests ([1228092](../../commit/1228092aeaeb87a75fa4150a0fd1a376255fa83d))
- Remove unused constants and improve error handling in event handlers ([2144f42](../../commit/2144f429bde1dc5b308d2c74a4b56de03584fa67))
- Phases complete ([76c40ef](../../commit/76c40efdd8713dbe995d8eb443ca834520fcee67))
- Update event sending logic and improve validation checks in EventManager ([70196de](../../commit/70196de558136869398f5a690502b046dbedbb57))

### 🔧 Other Changes

- Merge pull request #9 from nacorga/release/20250929.1 ([f89a7dc](../../commit/f89a7dc51f6e255fb9be0dab71bb2946f8872cad))
- Add SessionEndReason type to app types ([11f9a79](../../commit/11f9a799b7921e56a43a23d4c9fbf88d46956c8e))
- Merge branch 'main' of github.com:nacorga/tracelog-lib into release/20250929.1 ([3728289](../../commit/372828990b2b53c3798842428e1407465f170a59))
- Merge pull request #8 from nacorga/feature/refactor ([49fbc4d](../../commit/49fbc4d5c7d550d2ccd41da7f3c07011b7a06c64))
- Update build scripts to use 'build:browser:dev' for playground setup and E2E tests ([c398214](../../commit/c3982144bb018814a5c5142d52bdd57e6ff4c66d))
- Remove health check scripts and update CI workflows to use E2E tests for validation ([07621b3](../../commit/07621b3b54be7160847212b74b27c92a37fb5e6a))
- Add integration tests to CI workflows with error handling for improved testing coverage ([efcfeba](../../commit/efcfebab9c981d9f5ddfa6b07aadbd575cd48159))
- Update CI configuration and Vitest setup to use Node.js 20 and simplify global variable handling ([4c39c0d](../../commit/4c39c0d75ab7813b6d2c572bae0f22c89d006c0f))
- Update CI configuration to include bootstrap script for improved global variable handling ([ace4806](../../commit/ace48061590ba1743a2683c5be756f2381620185))
- Enhance CI setup and Vitest configuration for improved compatibility and error handling ([7a08706](../../commit/7a08706e72fef3854a4eba305b5ef784fd0910b2))
- Modify Vitest configuration for improved jsdom setup ([73b62fb](../../commit/73b62fb5208d774381dcb9d6734782ce5ccabbc7))
- Update CI workflows to use new unit test command and enhance global mock setup for compatibility ([26e372a](../../commit/26e372a55c1f5f0f82708bf8dafe02a403947b2d))
- Remove integration tests from CI workflows to simplify testing process ([3cc4d7d](../../commit/3cc4d7d845d3442918307c3749c0fcc8a9c27988))
- Update CI workflows to streamline test commands and enhance health analysis reporting ([ebe3f68](../../commit/ebe3f686a70af8b440ed7e42da037e6107e31c55))
- Add CI command for unit tests and update health check logging ([297fd97](../../commit/297fd971addafc5bb3a7a763af0ccf2bb57e9caf))
- Update Vitest configuration files and adjust test commands for integration testing ([cff9e0c](../../commit/cff9e0cfddc82bdb486f8169a2af57616ae40c23))
- Enhance CI workflows by adding unit tests, integration tests, and coverage report generation ([80910b2](../../commit/80910b2639178391b6ff305600be460ea70bbb89))
- Update .gitignore to include new directories and remove obsolete entries ([2b3334e](../../commit/2b3334ef3f55b220c3f07b8cd562e128cbe9ca0f))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.1.0...v0.2.0


## [0.1.0] - 2025-09-23

### ✨ Features

- Enhance ScrollHandler with retry logic for dynamic selectors and add mutation observer for pending elements ([e603bac](../../commit/e603baca421ace9cffcab09f18425b9784be141d))

### ♻️ Refactoring

- Add retry limits constants for ScrollHandler ([47c25e6](../../commit/47c25e6818b7929f53c1d23c79bd257f444e6ecf))

### 🔧 Other Changes

- Merge pull request #7 from nacorga/release/20250923.1 ([5bb1db5](../../commit/5bb1db5fa1f7e07295802180f0beb8547e4c652b))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia
- Nacho

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.0.8...v0.1.0


## [0.0.8] - 2025-09-23

### 🐛 Bug Fixes

- Update credentials settings for CORS requests in SenderManager ([681f153](../../commit/681f15364f408961cb8ab7735c2c684de1c36f07))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.0.7...v0.0.8


## [0.0.7] - 2025-09-23

### 🐛 Bug Fixes

- Use Blob for payload in sendBeacon calls in SenderManager ([26449b3](../../commit/26449b31d163d9f4b118ed8811da1a6319905e35))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.0.6...v0.0.7


## [0.0.6] - 2025-09-22

### 🐛 Bug Fixes

- Add Origin and Referer headers to CORS requests in SenderManager ([0532c78](../../commit/0532c7843aacdd69cb63b777517400d7c66be713))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.0.5...v0.0.6


## [0.0.5] - 2025-09-22

### 🐛 Bug Fixes

- Update CORS settings for fetch requests ([e9d9431](../../commit/e9d9431aa37441dcd054817a3bf0f92824cf5eb5))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.0.4...v0.0.5


## [0.0.4] - 2025-09-22

### 🔧 Other Changes

- Remove API_BASE_URL constant and update SenderManager to use apiUrl directly ([7f3e7af](../../commit/7f3e7af7ca4255ac8e16237436f0e09ddf030309))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.0.3...v0.0.4


## [0.0.3] - 2025-09-22

### 🔧 Other Changes

- Update event URL in SenderManager to use '/collect' endpoint ([4c7c614](../../commit/4c7c6142951505b89a217ea72d59d734f3872fd1))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.0.2...v0.0.3


## [0.0.2] - 2025-09-22

### 🔧 Other Changes

- Add mode.types export to app.types for improved type management ([f490001](../../commit/f490001244d3c80575a0ad47a2b6aa5eca2472e2))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- Ignacio Cortes Garcia

**Full Changelog**: https://github.com/nacorga/tracelog-lib/compare/v0.0.1...v0.0.2


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-09-22

### ✨ Features

- Add description to package.json and enhance pre-release validation workflow with E2E test execution ([5d7e4f0](../../commit/5d7e4f0d4963e20e398cf24c0ed15539023d5bf8))
- Add event capture utilities and common filters for TraceLog testing ([21109a7](../../commit/21109a7bdb5b67329809208886a8e098fdc595ad))
- Enhance logging and reporting in various handlers and managers ([e63bcf9](../../commit/e63bcf9ee6c64805986f25c126a3212e44a501c3))
- Implement error tracking utilities and tests for JavaScript and network errors ([e1ac784](../../commit/e1ac7848b0a629abd82e076dbef5b98f45255f4c))
- Enhance logging throughout the SDK for better debugging and error tracking ([1ce8ae8](../../commit/1ce8ae848848bb34f87d67ec2abfa78f9d79eef5))
- New logging system implementation ([90de1d3](../../commit/90de1d33845bff9c9651401af50181d0898da6fe))
- Enhance scroll tracking with new suppression tests and helper functions ([302183e](../../commit/302183ee74b7d3e96f7c544d425f370e35940d8c))
- Add new E2E tests for click tracking, scroll tracking, and page view tracking functionalities ([7f41b07](../../commit/7f41b07a50e503fd80ddaa6e402867a020437b42))
- Comprehensive GitHub Copilot instructions with validated timings ([75dc759](../../commit/75dc759cc95746de853f72ddf67c0774829d8c8a))
- Enhance session recovery with maximum recovery window and improved tracking ([92deed1](../../commit/92deed1ff7b2320ade08af7cc9603831b2372526))
- Enhance session management with cross-tab support and recovery mechanisms ([6a00ef5](../../commit/6a00ef5d0a6309e78392a1b1cbcad084735eedc0))
- Implement cross-tab session management and session recovery features ([030ba67](../../commit/030ba678a489caf830d19eb736d954dc2edd5a3c))
- Session end improvement ([fefd506](../../commit/fefd506e5ba078f66f79bf323b766ad0c558cdc1))
- Implement error and network handling with sampling configuration ([f2b92e0](../../commit/f2b92e0c0a1c72503d270641d559659114c3ee80))
- Add web vitals sampling configuration and update event sampling logic ([42b0522](../../commit/42b05220016e5bae18dda7e15e536bfe62bec9bc))
- Web vitals tracking and performance handler implementation ([4fa4bd4](../../commit/4fa4bd40aba6b0b677a6b8af958083d3e66b74ee))
- Add IP exclusion feature for Google Analytics tracking and update config validation ([b2d966e](../../commit/b2d966e2a92bba4bd1d80943925c89de37bac179))
- Add configuration validation and normalization utility; update init function to use validated config ([5e751e5](../../commit/5e751e58f0dd305bf20cb54b9831a9133fadff8a))
- Enhance RC version cleanup functionality; add option to clean all RC versions and improve timestamp sorting ([f376dc7](../../commit/f376dc7d263cbb76901e32b7f4dd66cb1f10d8bc))
- Enhance page URL tracking and session management; improve error handling in initialization ([ab877a9](../../commit/ab877a9a821f0f4b69cb4d96c6b200d843622738))
- Add Google Analytics logging for custom events in processAndSend method ([880f831](../../commit/880f831b03ba7059e290a68485e27e7a9e340f38))
- Move Google Analytics custom event tracking to processAndSend method ([05f3853](../../commit/05f3853acee976a936aa5cdf2b5f9f28312a4bef))
- Integrate Google Analytics for event tracking and add configuration options ([c41cf28](../../commit/c41cf2822381f31fa0d9c99e93ecf31e6bbf82ca))
- Add debounce time constants for click and scroll events ([130775d](../../commit/130775d5fce3869bd16a00473e34a69b58a06a79))
- Enhance session management with new listener managers and local storage fallback ([0038c81](../../commit/0038c814c01b93df041c3e20ab7e1ba9eed91a9a))
- Implement app initialization, event tracking, and session management with cleanup methods ([cf645c2](../../commit/cf645c25ca53f5c23f4a9de7d868f438789152c9))
- Add scroll tracking functionality with debounce handling ([222fd2d](../../commit/222fd2dc70e2bdbc8dd0d8dc96e9e29fb2dd6f70))
- Enhance app initialization with error handling and state management ([7ecf1ad](../../commit/7ecf1add3336ef08a3c87f7a9a9e21cb982eb38c))
- Implement click tracking handler and enhance session management ([c406963](../../commit/c40696340bff85f29af7444c3dcf8e1db6e46831))
- Refactor app structure for improved organization ([20be03a](../../commit/20be03a3cd5c66851ef98d3a6dbe4c4ecc64703e))
- Implement event tracking and sampling management with page view handling ([7d5d5f4](../../commit/7d5d5f412ec8111e84a5282c9a2986e6290baa67))
- Enhance session management with device detection and UTM parameters integration ([eb8dad5](../../commit/eb8dad5928956aed20309f0223d798b790248325))
- Initial set up ([9a6a3f4](../../commit/9a6a3f42afdc01b1a7dc6f4b46c121889554daa4))
- Validate custom API URL protocol ([01bbab8](../../commit/01bbab8256aec1aeb368170715eaa400e9e62394))
- Implement modular configuration management with fetcher, loader, and validator ([6439013](../../commit/64390135675fce603017f6e83ce55d3573aa3cbc))
- Add allowHttp configuration option and enhance URL validation ([1ea9220](../../commit/1ea922018fee1e8808a501b18bf96fcb1f9cad34))
- Enhance configuration validation and documentation for custom API settings ([54bfeee](../../commit/54bfeee333a98ada2cbfba90c2358e43c621d76c))
- Support dynamic config via customApiConfigUrl ([f434127](../../commit/f434127d5ae55ed416c9690e5e251fe20c6f59df))
- Allow providing api config with custom endpoint ([57d6c9a](../../commit/57d6c9a30d2b5ad9424bb2d92af1c36b40ecf357))
- Allow custom event endpoint ([f033f13](../../commit/f033f13d72937ded2352fb65bbc7a46688d5f12c))
- Enhance tag handling in EventManager and update types for improved structure ([9ad262d](../../commit/9ad262d7cb7f4a687a918902974d85b28ca991fe))
- Handle sessions on excluded routes ([28206e8](../../commit/28206e8e0baa8ce4004d03582e28ba8018005034))
- Anonymize session events on excluded paths ([75d798d](../../commit/75d798d8cd789d85364309f96b7ecaa89fbc49e3))
- Add benchmarking scripts and update README with performance metrics ([f2b0849](../../commit/f2b08497c279b8b2018585522efe018c45c2e2bc))
- Increase CLICK_DEBOUNCE_TIME to 500ms and enhance event timestamp handling in EventManager ([b7b48e1](../../commit/b7b48e1c1ce4c005e33cc8d872e8f6b28b5a438f))
- Update event manager to track page URL changes during navigation ([4fa9104](../../commit/4fa9104c31d5cb930cdda548c47ea5d06647eed3))
- Add cleanup for page view handling ([d61a3ee](../../commit/d61a3ee9edb715ffbe095be6c1315dce35a114cf))
- Add version management by importing version from package.json ([6cca685](../../commit/6cca685a3d5057382af5e706733a43fd8325d682))
- Implement comprehensive tracking system with demo mode support and new Vite build setup ([7750c14](../../commit/7750c14b0595ab33e80ccc5798032309d3c18234))
- Improve tracking and configuration management with scroll suppression and URL handling ([a9fb3e7](../../commit/a9fb3e7366676261c9eaa7064df392ef904ce106))
- Configure husky v9 with lint-staged and commitlint ([ddcbc25](../../commit/ddcbc254eae22eb3053a4ed063ebb462f4042b81))
- Enable mobile testing in Playwright and enhance event tagging functionality ([d8c1e85](../../commit/d8c1e850f727a30895f4a9fc7e87db698e06dd39))
- Add Playwright for end-to-end testing and implement various test cases ([a9c5f84](../../commit/a9c5f849cf3f3fc44db9ecdd2e05dcb79f2bbd89))

### 🐛 Bug Fixes

- Update testing bridge references and improve logging behavior for development environment ([e3e384e](../../commit/e3e384ead6360626d47fd7454df7827cc612bd3e))
- Enhance mode validation in DebugLogger to handle undefined values ([949f5f7](../../commit/949f5f7f8cb5feeb0afc399f0ba2383c74138224))
- Correct interval activation logic in EventManager and enhance mode validation in SenderManager ([ba241ee](../../commit/ba241eefaa82cedf5083ede62c32de94bca857aa))
- Update default configuration to use HttpSkip project ID ([da34742](../../commit/da347429adc30acff623f044ea902a4b7af495ee))
- Improve TTFB reporting and validation in performance handler ([c5af3ef](../../commit/c5af3ef9f1386801f493e934f4f6124c02877249))
- Improve leader election reliability and performance validation tolerance ([5952fc1](../../commit/5952fc15127a402d0068e9f3b895cdb394db1bdb))
- Validate session end leader ([869dd99](../../commit/869dd99ac8b6f750805d0424aa2c3a38230fe7bb))
- Cleanup session on sync end errors ([6a25d0e](../../commit/6a25d0ef7e6e068d2d620313b685672dbf9ee66f))
- Improve variable naming for clarity and enhance value validation in trackWebVital method ([2017c62](../../commit/2017c62f3f63fe07b95bb45ef44474c1cf373ccd))
- Enforce value as a required number in WebVitalsData and enhance validation in trackWebVital method ([ca9035b](../../commit/ca9035bc55a358e5e14d08667565b3def700a5de))
- Validate value type in trackWebVital method to ensure only numbers are processed ([813d159](../../commit/813d159e9417cd8f1e40682b35f957fdfe87947c))
- Refine handling of 'from_page_url' in event payload to exclude routes ([2da25ee](../../commit/2da25ee0f6e10b1c893c8905ea0f7a3b90ba0f96))
- Add 'ipExcluded' to allowed API config keys and enhance tags handling in sanitizeApiConfig ([ae9c2fe](../../commit/ae9c2fee741c00a1351b2886adfb44021c893619))
- Enhance session event handling and update state management for event tracking ([a3e3e3e](../../commit/a3e3e3e1a7b4554de1a413f95dae404ec8bcee30))
- Improve Google Analytics initialization and script loading logic ([662fb7d](../../commit/662fb7d06add856a2deed3104aca3417e796661d))
- Refine event logging and Google Analytics tracking for QA mode ([6606f07](../../commit/6606f07abf8bccd6830611fed7f6c6d5944569f5))
- Ensure Google Analytics integration initializes correctly and respects IP exclusion in event tracking ([3ed8ed5](../../commit/3ed8ed5e906ae0257fa9757dab57eb9aade54093))
- Enhance config API response validation to include array check ([8221f48](../../commit/8221f48fe024f54e1161685fe65e73e643d09afa))
- Configuration management default config handling ([320259c](../../commit/320259c51b95169eeb2dcf3b0e5fdf6b641f203e))
- Update page_url assignment to handle excluded routes correctly ([573f56c](../../commit/573f56cb08559b0990b422e04cda8736c4ff9ef0))
- Correct paths in package.json and disable sourcemaps in vite.config ([b8e97f5](../../commit/b8e97f58adf49b191dc87640516f579fb4f3547b))
- Improve error handling in event tracking for uninitialized app ([82aeaf5](../../commit/82aeaf5eadbf7807cdbbeda66996dd0460d0e666))
- Update tag structure in EventManager to use 'key' instead of 'name' and adjust related types ([d56e050](../../commit/d56e05004819a231aa1a527b2c0925aa1f2e612e))
- Handle optional chaining in event manager and improve error handling in sanitization functions ([6fead86](../../commit/6fead86928491b0412dda82cd3ea6191789aaaca))
- Make ApiConfig properties optional and improve validation logic ([0f10c74](../../commit/0f10c7429e157ea54b8fb8194194edda622c9bdc))
- Update error message for invalid configuration to use 'or' instead of 'and/or' ([cbb2c13](../../commit/cbb2c1389d08ec81403dc7eecdc6d14cf584c680))
- ExcludedUrlPaths API config sanitization ([06a2531](../../commit/06a253169bfb102da6d8ecf6c6ff0c38a7e3c584))
- Update RC version generation to use workflow run count instead of run number ([919c7a0](../../commit/919c7a0a2ba52b1c309ee94c87655dcd1bcb6dc9))
- Update extractTrackingData to return undefined instead of throwing an error for missing name attribute ([0991a91](../../commit/0991a915005eeb396d20a6b82aedae80bf7ab668))
- Add error handling for initialization promise in Tracking class ([ea4cd89](../../commit/ea4cd894f821c88d2fd56f38ae9f3f481a512d0d))
- Ensure null value is handled during serialization in SafeLocalStorage ([6c51148](../../commit/6c5114837cede574435cb37ec3a6a0df84482523))
- Avoid double serialization in SafeLocalStorage ([dfdbe18](../../commit/dfdbe183afa618c41931de7abe468f683ab8dc83))
- Use sanitized global metadata ([b769143](../../commit/b7691434c5990f5e6bc1f879e4f5f9e33ee5f078))
- Ensure proper timeout handling in fetchConfig method of ConfigManager ([b2fcbc4](../../commit/b2fcbc49c281d826a0a61b305d67eb7a9927a6ee))
- Improve host validation in ConfigManager to ensure proper hostname structure ([5aeaafd](../../commit/5aeaafdf8eb6b042cb05ad206d557161f068f940))
- Add error handling and retry scheduling for failed event sending in DataSender ([ceb2509](../../commit/ceb250939ad22f2a6946e71b415427faf0b67748))
- Update API configuration keys ([c589939](../../commit/c5899396b99fb8d684ed0747dc2c76bf84aa9d9c))
- Update paths in package.json to point to the correct source files ([bda2da9](../../commit/bda2da9a5ed7e6f362bd18accd0ebaa5823b5d8b))
- Remove click listener on cleanup ([cdf9a69](../../commit/cdf9a6966974a30f687147906aca959db88b43ec))
- Update version in package.json, enhance scroll handling for mobile compatibility, and add extensive session state management tests ([1d8fb5e](../../commit/1d8fb5e8ede8554fda2908cc5dfb0abf2996a7c0))

### 🧪 Tests

- Restart ([ac31810](../../commit/ac31810d272dbfad41b678bc28204e473a3981a4))
- Add comprehensive performance impact tests for library overhead, main thread responsiveness, and memory management ([205b4e8](../../commit/205b4e8d1acede2a90c6ecc99e96ec90c88968d5))
- Refactor ([b2f259e](../../commit/b2f259e1646058323427b0c7671796959d3202c9))
- Add extensive performance tracking tests for web vitals fallback scenarios and browser capability handling ([d235f78](../../commit/d235f789859742ff57af7fe49e2b9beca8d0c13e))
- Add extensive performance tracking tests for long task detection, throttling, and sampling behavior ([edfe5e2](../../commit/edfe5e21a04419861f912aab03dc43030ecbdfa0))
- Add comprehensive performance tracking tests for web vitals collection and validation ([95eb0c1](../../commit/95eb0c1d4152f320fdd383d5244f69b0106f02c7))
- Add performance tests for click interactions and page view latency under 50ms ([ab4d260](../../commit/ab4d260967f1fe4dc7798471c8971340342c0bc3))
- Scroll tracking custom container scroll ([a98bc54](../../commit/a98bc54218b1b5be5ec87346613582c0225b3330))
- Implement comprehensive scroll tracking tests for accurate event capturing and depth calculations ([0928649](../../commit/0928649732b77e90346c09d034229d4ba0f04ef7))
- Add extensive click tracking tests for accurate coordinate calculations across various scenarios ([b33a865](../../commit/b33a865003c535004cf17a35e3f937505403ebba))
- Add extensive click tracking tests for elements with custom data attributes ([fb1ffd9](../../commit/fb1ffd9bdaf8ba2f9b907124a027ae211124635d))
- Implement comprehensive click tracking tests for interactive elements ([6bb2a38](../../commit/6bb2a385387ef5ecb253b72e3cb5d6abd47a3903))
- PAGE_VIEW event tracking, URL capture, referrer extraction, and timing accuracy ([0d6f669](../../commit/0d6f669c518fb46773a3cdb73be27c4d7bb5c413))
- Enhance metadata sanitization tests for XSS prevention and content integrity ([408f22e](../../commit/408f22e9b9969b91eb62a7d63daf59be533ad7db))
- Add comprehensive E2E tests for custom event tracking with invalid metadata scenarios ([0594c0d](../../commit/0594c0d607fabd4359682abde6a45dc6907f15fc))
- Checks for empty, null, undefined, non-string, and invalid character event names ([c1c399e](../../commit/c1c399e09d4425ac9c18bfc5afcb666cbe484130))
- 010-session-management-page-unload-session-end ([23bafe8](../../commit/23bafe80dbbed1df8b59b4700cacc69e9594bade))
- 009-session-management-cross-tab-session-coordination ([15b1fe4](../../commit/15b1fe4d3c5329b27de57d32351898756f4d6692))
- 008-session-management-session-recovery ([04ec7b0](../../commit/04ec7b0eec37e975e6a7c2032a3124e121816747))
- 007-session-management-custom-session-timeout ([72163ed](../../commit/72163ed404cf7643c61bb00697ebd5a44a80e3b8))
- 006-session-management-session-timeout ([46a54cf](../../commit/46a54cf975f0a0d83cddcc7e19db212e10408f1e))
- 005-session-management-session-start ([4e381f6](../../commit/4e381f650c28641b750b3868d7dbb962e3b83329))
- Initialization tests ([7a02ec2](../../commit/7a02ec25029a6716c268eb32e199224324dc10b3))
- 004-library-initialization-duplicate-prevention ([0d596e2](../../commit/0d596e2146d5a61bf31cdba23b6511c8b03be457))
- 003-library-initialization-browser-environment-check ([3d0dc8c](../../commit/3d0dc8c17ab99e35b1f584586a9a7d2ea8283a77))
- 002-library-initialization-invalid-project-id ([0d1cefa](../../commit/0d1cefa862c484b46127295c53789d8ee10b1256))
- 001-library-initialization-success refactor ([5e0820a](../../commit/5e0820a2501412b7d51c5edcafc40c00c7b4ce0f))
- 001-library-initialization-success ([aed3ff0](../../commit/aed3ff0ffb0e83fafbf146133b3e644846a8b737))
- Enhance session destroy tests with detailed event checks ([b5022f0](../../commit/b5022f0a656e15d8d5c39baaa735b7581a9d35a3))
- Ensure single session end on destroy ([b31f9ab](../../commit/b31f9abee8d544bc1ed64c0536dc6c32f71ed9d3))
- Cover session recovery cases ([3c0be98](../../commit/3c0be98f56738f6f9f1dbb79018ba0c13cb208c8))
- Adjust rapid click event timestamp tolerance to 250ms ([4040420](../../commit/4040420f4928ff18b81f7d23bfa040453912d603))
- Update rapid click event timestamp tolerance to 300ms ([18ee60a](../../commit/18ee60a8e469fca0de8df76d7a4d3c7c1d2dafb7))
- Update timestamp tolerance for rapid click events to 200ms ([8a87727](../../commit/8a8772766fa12645aab87b7a55b002d35ef1800b))
- Add tests for click event order and behavior with links ([9e6f723](../../commit/9e6f723e6d364aede84e428a5b4717684a66fef4))
- Events queue test ([18aa2b5](../../commit/18aa2b5a9dc972f7180915cd1e1cf109e70390a0))
- Add E2E tests for app initialization ([1cff97a](../../commit/1cff97a6168f3eb8d8d7cbb0214e653ed58a1cf7))
- Add sessionTimeout check in API config tests ([d80e6d9](../../commit/d80e6d98bad2ccfa829a6d18d2aec725be790716))
- Add e2e coverage for static api config and allowHttp ([87e9115](../../commit/87e9115d7dbcdc1c8c23ceb66e144b6a829c68c8))
- Add end-to-end tests for custom and page view events in demo mode ([753f40a](../../commit/753f40aaf25446ad0598a050037da8866dae8499))
- Add end-to-end tests for click, scroll, and session end events in demo mode ([7a34b66](../../commit/7a34b66ee57b7920ec51bd65312c1b075093cc13))

### 📚 Documentation

- Add important SDK initialization note for E2E tests ([46bc0a8](../../commit/46bc0a81522cac5bced3e639fa7896f7eefbe322))
- Add branching requirements for E2E tests across multiple test categories ([364fe4a](../../commit/364fe4af48ac1bdbe461ef58a45df4698342a506))
- Add E2E tests for initialization and session management functionality in TraceLog SDK ([d4eb130](../../commit/d4eb13018a2eec3440442cf9d75357d844226364))
- Markdown files ([f9774ec](../../commit/f9774eceb27ee05ab70f7408de1b5f109a73d717))
- Add initial context documentation for TraceLog client library ([b2af199](../../commit/b2af199f149ba79ce7f1e00f8d49d977823330ca))
- Update README ([94d4b5b](../../commit/94d4b5b9d14706258fcec312aa333733267a5015))
- Update README ([9a2fb53](../../commit/9a2fb530434389e30cfe3329c25e770fb40e41b3))
- Update README to clarify setup options and improve installation instructions ([466b9c0](../../commit/466b9c0d3277d99cba753d616cd8e5ff7f2d33c9))
- Add common issues section to README for custom API usage ([372d352](../../commit/372d3524866d6d07fb68cfcfe21e73b51e08b628))
- Remove API.md and update README.md for streamlined documentation ([8d96223](../../commit/8d96223bf98978942a865e0f3dbb308bae3bf463))
- Remove EXAMPLES.md and INSTALLATION.md, update API.md and README.md to reflect changes ([bf70c61](../../commit/bf70c61a08270cc0f9d59ba2bbdb217eeab0baa6))
- Update changelog ([44074dc](../../commit/44074dca1bb23a84be573e044f45bb91d599287b))
- Add missing build commit to CHANGELOG.md for v0.0.5 ([a8616d6](../../commit/a8616d66425e927eecca000ab849f74d02f08bf0))
- StartTracking and sendCustomEvent renamed to TraceLog.init and TraceLog.event for improved clarity ([4cd874c](../../commit/4cd874cd2da3369f7b3873953496a99097b12f24))

### ♻️ Refactoring

- Replace string literals with enum values for application modes across multiple managers and handlers ([d5b3469](../../commit/d5b3469903ccb8fed47be967e361229073acfc3b))
- Streamline initialization process and update configuration handling for logging modes ([e09d1a7](../../commit/e09d1a7d319be01ebd1ce5fa3006c95cfcc8acad))
- Simplify initialization logging and enhance configuration handling for special project IDs ([87a6afd](../../commit/87a6afde318a198a4a8ae2881b57c77ebf2a8505))
- Change logging level from info to debug in various handlers and managers ([38e17c3](../../commit/38e17c398af04783c012334575a980bc896f6100))
- Remove unused performance test configurations and clean up initialization tests ([351a49e](../../commit/351a49e5273a785effc7855a3dfad578c045c57e))
- Performance tracking tests to utilize new helper functions for web vitals and long task detection ([d73ec5c](../../commit/d73ec5c18af9fe900446f99f7c7c0e1e0b49b6cb))
- Restructure event tracking helpers ([84edc82](../../commit/84edc82412aee0982c7ce61327a5802b871dfbdb))
- Testing bridge for E2E tests ([8f68fa3](../../commit/8f68fa332ffe4603aca0ae9490f51874007b3f50))
- Update trace log warnings to use the correct monitor in cross-tab session coordination tests ([75650a4](../../commit/75650a4dc53257a9cfab7cb339fbcec28ddf7274))
- Consolidate trace log warnings in E2E tests for improved readability and consistency ([1b11791](../../commit/1b117914390f854c0f6208a7e44175720a8c516f))
- Replace console warnings with trace log warnings in E2E tests for better logging consistency ([f93f848](../../commit/f93f84844447846c59acb5c8ba06b33f88b16d51))
- Unify test utilities under TestUtils and enhance error handling in event tracking ([7ce86e8](../../commit/7ce86e8582bcaa367df06e5ecc81ef4e89ffe437))
- Replace TestHelpers with TestUtils across E2E tests for improved consistency and maintainability ([a029a2a](../../commit/a029a2a44d5a9d64664ca5f43ad52ce427de42d7))
- Update E2E tests to use simplified initialization configurations and improve QA mode logging ([98f206c](../../commit/98f206c6d4e3395d37049c93d8d089dfe39c0e8e))
- Streamline E2E test initialization by removing redundant configurations and enhancing navigation methods ([44e4262](../../commit/44e42623f246e91afa3202de8ade742e7fe6150f))
- Enhance E2E test structure with new initialization and session management scenarios ([79326b5](../../commit/79326b5b63fddb0d70c343afc8a259467ee609bd))
- Enhance performance benchmarking and storage error handling in E2E tests ([069f4ad](../../commit/069f4ad64ebbbb2f0d96cf24f8eef7b8054ae02f))
- Implement lazy initialization for CrossTabSessionManager and enhance cross-tab support checks ([f88ecf3](../../commit/f88ecf3b70ef9d74490ad02d769ee77d225a455a))
- Enhance session health monitoring and cross-tab conflict handling ([bb1d5dd](../../commit/bb1d5dda875fde471bfbf042472c9b2626237a30))
- Enhance logging and error handling in E2E tests ([ee466f3](../../commit/ee466f3b7d0a3d1d98bae904611d348cd6cdd4f8))
- Enhance initialization handling and improve resource cleanup ([9d87720](../../commit/9d87720d5598b809841051417b7e8369b760d2f7))
- Improve session handling with async operations and error management ([a708507](../../commit/a708507c4c25cf5adb152820f1304245da21425b))
- Enhance session management test helpers and consolidate session data handling ([37d9f45](../../commit/37d9f454ddb5ccb72ad71d5253b9c075299d7f83))
- Update session management logic and improve cross-tab handling ([e22e918](../../commit/e22e91847992fce8e9d5d96c0d5ab327e7779b83))
- Rename test helpers and remove unused type guards ([6f6e75a](../../commit/6f6e75a841320bd3510a63b272d0a15e530b97b6))
- E2e tests restart and instructions ([9113d8c](../../commit/9113d8c2f29e5f1a7d95c8233f103b7a566aa66c))
- Consolidate session cleanup logic into a single method ([d7822ab](../../commit/d7822ab6f79f8d1ebba627ea6a875ce5335ef4c8))
- Enhance error handling and logging in session recovery and cross-tab session managers ([1d7b5bc](../../commit/1d7b5bc0bbcad02d9720119a974effdcaa67376e))
- Remove unused getRecoveryStats method from SessionRecoveryManager ([1a338a0](../../commit/1a338a037e2bdf9e14d440d75609f04b180d4356))
- Clean up session manager initialization ([fbba024](../../commit/fbba0249affce4f07a42c3891886b51ff0117135))
- Add SYNC_XHR_TIMEOUT constant and MIN_SESSION_RECOVERY_WINDOW constant ([aba4322](../../commit/aba4322223ac2e9ea89f506a4567e2cf8816a40d))
- Optimize console log clearing method in page view events test ([e7fc523](../../commit/e7fc523472c8e046202045e927164b6a46bd9f71))
- Improve listener setup in CrossTabSessionManager and enhance session recovery window calculation ([e62c418](../../commit/e62c41807bdb4214e6c335cf37a685848a36a1ae))
- Replace hardcoded timeout with constant in sendSyncXHR and improve recovery attempts management ([41617c6](../../commit/41617c643255db4740debd69c13878778c879f7c))
- Simplify callback handling in CrossTabSessionManager and update session recovery method signatures ([6926413](../../commit/6926413a600bef0b52849b262d2169978c04b648))
- Streamline session recovery data handling and improve session end management ([ce9d1ad](../../commit/ce9d1adaf3785b04088fa02b1b2f167f079224cf))
- Improve BroadcastChannel initialization and enhance session recovery logging ([d7ebeaf](../../commit/d7ebeaf41497665930174a621bf01cb5a9d3beb5))
- Replace logUnknownError with logUnknown for improved error logging consistency ([4d4b1ac](../../commit/4d4b1ac0e48498edf2e97d0057e1e6d453360a2a))
- Enhance page view data extraction to return undefined when no data is available ([5f1c204](../../commit/5f1c204b1dac69e5c1c71ee88eb42d8e582e84fc))
- Update event handling to use BaseEventsQueueDto and add page view data extraction ([4a5a4dd](../../commit/4a5a4dd1b6e795a6b2f4cb924ffdd74c268c0d41))
- Add error sampling validation and update configuration handling ([49f763c](../../commit/49f763c90eaa6f8e6ede2d3f4087fb0a8f88d43e))
- Simplify XMLHttpRequest method bindings for better readability and maintainability ([cb48dc5](../../commit/cb48dc591ee7e2b3a29664edc0ecf8c41d1ce302))
- Simplify error handling in PerformanceHandler by ignoring disconnect errors ([0481685](../../commit/0481685d79398081391d7fcb61916c02d77702e2))
- Improve performance metrics handling and update README for clarity ([a49fe1a](../../commit/a49fe1ab3e521a08ec03176d15a9818eae847429))
- Streamline className handling in ClickHandler and update heartbeat interval type in SessionHandler ([685b4d6](../../commit/685b4d6a0eedd302d6b2d4dce7256e3709c9f3c8))
- Session and event management by improving handler checks and updating API URL generation ([2af16b2](../../commit/2af16b2a948569ffb80d1342a3eb161428afbc3e))
- Consolidate constants and improve structure ([8552760](../../commit/855276035cebbfd9cd387e4d6f2189fe76186429))
- Enhance app initialization with browser environment check and improve error handling ([785a9e5](../../commit/785a9e504e035edd364a6d0764da634d7a287262))
- Simplify click element selection logic and adjust event processing order ([dd1f097](../../commit/dd1f097b569c247ba7c8882c197225c0b9c791f8))
- Enhance INTERACTIVE_SELECTORS and improve click element matching logic ([7ee9b30](../../commit/7ee9b3000d08fa7d4cb7a6b79b3c3baeb5e75cf7))
- Remove CLICK_DEBOUNCE_TIME constant and simplify click handling logic ([c99f901](../../commit/c99f901497cf02fe0dba7fc30cc0bef450e796b2))
- Update device type in Queue interface to use DeviceType ([2d8ea25](../../commit/2d8ea251ab0326f3fdbc9adffa69eddb896ae743))
- Update sendEventsQueue to check for qaMode instead of demo/test config ([3c790ca](../../commit/3c790ca3e9999a2ee10916468a9b34cb76dbd79f))
- Unify event logging method for demo and test configurations ([da650f5](../../commit/da650f54c1fa350ecea25c927e6d3fd29e41b474))
- Integrate StorageManager into various components ([fdd5d5b](../../commit/fdd5d5ba25964eba10213fdf9ab5806f4ff1d8f5))
- Utils files structure ([8f2fbf0](../../commit/8f2fbf07f5164fb92ddc37f7b657df9ba5f46f59))
- Reorganize imports in queue.types.ts for clarity ([fa9b944](../../commit/fa9b94419ec4f305432f64d1445645cf4a108e4e))
- Remove unused types and utility functions ([7d4ea8c](../../commit/7d4ea8c728daaab0e572bf340ed61987f815f757))
- Restructure project by moving services to managers and adding new manager classes for improved organization ([d3d03eb](../../commit/d3d03eb14b9a70020663dc8e9ec106418e8c7723))
- Simplify handler constructors by removing unused onTrack parameter and adjust tracking methods to synchronous ([302fb47](../../commit/302fb4700abc327912ef339c261ab9b24b3aa825))
- App services ([f7fa669](../../commit/f7fa6692ecfe05dde0faba7421c25c33cf716c30))
- Improve data sending logic with enhanced error handling and rate limiting ([0ca0ada](../../commit/0ca0ada59735010eba549ea6f36ee92e022fb226))
- Remove unicorn plugin and simplify ESLint configuration; add session and user management features ([a7adb6f](../../commit/a7adb6f2462519322c616d5afe59ad975b9fcd51))
- Simplify logging and remove binds ([d9418fc](../../commit/d9418fc6195ac9c5e3a9749cb1b31d012eae1b27))
- Remove custom api config options ([f484f4e](../../commit/f484f4e5f7ea9b86cb178e1db05b135c4da8908c))
- Update API configuration structure and validation logic ([c808011](../../commit/c80801197c4138d6c0060e39521c80dfcd5a3561))
- Rename AppConfig interface to Config ([bc4a238](../../commit/bc4a238e911cf602ca16c36ce85a1eadae908082))
- Update config field names ([9c59b20](../../commit/9c59b2052a331fe7194aa9dc32e8c3ef24192bdb))
- Flatten apiConfig options ([2691442](../../commit/2691442df239dac167f9fbba2fbeeac76cfd58d3))
- Adjust debounce time for duplicate event clicks in demo mode tests ([3e16c84](../../commit/3e16c8473fabc94a780f9b588023e8eb8f69fde7))
- Enhance configuration validation for TraceLog initialization ([70010d8](../../commit/70010d85291d56adfaee618167e55dd9b8d1a186))
- Update TraceLog initialization to accept configuration object instead of separate ID and config parameters ([0340a76](../../commit/0340a7620748654c4fba55a01a4cffa769afbc78))
- Streamline error handling by removing log statements and throwing errors directly ([d3e137f](../../commit/d3e137f158dfa9f43eca275db53f79365d0afa41))
- Implement centralized logging mechanism across modules ([a94549b](../../commit/a94549b6011a9ce9711136a5858152991fb1e3d6))
- Share buildDynamicApiUrl util ([eb55703](../../commit/eb55703200a787034785d910a773949111eb767b))
- Simplify error handling by removing AdminError interface and updating catchError methods ([00e70cd](../../commit/00e70cd487ce9cff32e1681ca62567d56f5bc308))
- Consolidate performance constants into a single file and remove deprecated config-constants ([6ac8bd1](../../commit/6ac8bd159e5bb857d3dc5fa374bfcb0a6b42784a))
- Restructure config management for improved modularity and maintainability ([206f8f7](../../commit/206f8f715210ec8be0614e0266c4edadde4c1d80))
- Improve suppressNextEvent method by adding suppressTimer for better timeout management ([b833421](../../commit/b8334219f33d8647e6e172b3d1e9e48c404311b1))
- Update clearPersistedEvents and recoverPersistedEvents methods to accept userId parameter ([998f22c](../../commit/998f22c36187aefe2d3ad2a56f77069c55ec0e1d))
- Enhance event deduplication logic in EventManager in unique key generation ([8f732a4](../../commit/8f732a413a4ae72c106de6fd332f68bdb4c309ec))
- Modify sendEventsSynchronously to return success status and handle critical event persistence ([a7baa83](../../commit/a7baa83c03816b47ee86a3326c38e9dfc336a26b))
- Extract SafeLocalStorage ([b274f24](../../commit/b274f2461f89758fe8cbf59be51e783676b9e27a))
- Update ConfigManager to store configuration directly in the class instance for improved state management ([88e02ec](../../commit/88e02ec4b68512b49033aad5410b82eb43b75a91))
- Simplify DataSender initialization by removing unused userId retrieval and optimizing constructor parameters ([e9c1d39](../../commit/e9c1d39eb71b43a9b3daa203a2c2fa541f9abe0b))
- Update initializationPromise handling in Tracking class for improved clarity and consistency ([cd7cf2f](../../commit/cd7cf2fe68f5ee948f5d4087c4eedcae8f99f9eb))
- Rename sendCustomEvent to event and update related methods for improved clarity and consistency ([cf82d20](../../commit/cf82d2077f3dd3fb7f58bcce21dd4fcc27f16384))
- Update API interface properties for consistency and clarity, and enhance package versioning ([0b2c43d](../../commit/0b2c43d70fad492acd5fe1cfb0d421cf232c7429))
- Update performance constants and improve click handling logic with debouncing ([e0269b7](../../commit/e0269b739832425e6207ba3b29bdbf18fe4abebe))
- Update import paths to use relative paths instead of aliases in various modules and tests ([9b9fbbd](../../commit/9b9fbbd1a45b069591629610b60a5a249394349c))
- Streamline cleanup listeners and error handling in tracking and data sender modules ([589559b](../../commit/589559bd81c6d83bac47b28146e1d7847649a251))
- Simplify Playwright configuration by removing default launch options ([6def290](../../commit/6def2905bec05eb142cebdd0702dfa0510fe24be))
- Update project configuration ([bf623f5](../../commit/bf623f5261a2eb5e0e579a15abe1a55690c255ce))

### 🔧 Other Changes

- Merge pull request #6 from nacorga/release/20250922.1 ([5bdb4f9](../../commit/5bdb4f97c8c5561dddaf41a4004305a8eb55d63b))
- Update health check workflow to include additional pull request event types and conditional job execution ([1090c72](../../commit/1090c72b8096fa0e2edb6807f12e6b7540d4209f))
- Update references from "TraceLog Events Library" to "TraceLog Library" across documentation and scripts ([ca73236](../../commit/ca732365bfaacefa104acde6164491ec44c4709f))
- Revert version to 0.0.1 in package.json and remove CHANGELOG.md ([831417b](../../commit/831417bec14ed0dfe6f1a675e5f37b877166b420))
- Rename package from @tracelog/events to @tracelog/lib in package.json and related files ([137946e](../../commit/137946ef2e7c777a4dadf1b21ecc904a32684d1e))
- Add CI health check scripts and workflows for improved deployment validation ([c5c42d2](../../commit/c5c42d22209bfbeba3aabaa175324cf1d9694963))
- Release v0.0.3 ([bf8a7a1](../../commit/bf8a7a10c0b2c20d4536b65ae295e811a141def1))
- Merge pull request #5 from nacorga/release/20250922.1 ([fa8b63a](../../commit/fa8b63a1d7c5dc9af814102639a1921adf50fddd))
- Add playground setup and development scripts, enhance Vite configuration for playground environment ([92a4a00](../../commit/92a4a0050c8e4c648790730f1bc7a9b8c22baeba))
- Release v0.0.2 ([db91855](../../commit/db91855cb7061751a57c7d9a054c9827e9d1696d))
- Update documentation and references from TraceLog SDK to TraceLog Events Library ([6c0068c](../../commit/6c0068c4c247826897db0254f6a072e61128500b))
- Release v0.0.1 ([8772d8c](../../commit/8772d8cf19a53ceb19af31fa97b0597905a4ce1f))
- Rename package from @tracelog/sdk to @tracelog/events in package.json and related files ([2256867](../../commit/2256867993dd1314d7c94fcfdffcaf3e2889391e))
- Add NODE_AUTH_TOKEN environment variable to release workflow for npm authentication ([d7739f0](../../commit/d7739f09167672178a2bad7bebddf8206d8cbbc3))
- Update CI and release workflows to include Node.js setup and install Playwright browsers ([34b4d81](../../commit/34b4d81f04e4754c7604da106e1a3ceba93640a2))
- Update upload-artifact action to version 4 in release workflow ([b5f127e](../../commit/b5f127e20aa4dfe4b1a2496174bb57cafd043246))
- Merge pull request #4 from nacorga/release/20250920.3 ([4941b41](../../commit/4941b41b136abd9bc5c14b0841d8c9d3338b4239))
- Remove performance benchmark references from documentation and scripts ([b778c42](../../commit/b778c429243893728f3d1b212f612411a318d6bc))
- Remove performance benchmark steps from CI and release workflows ([0050f6d](../../commit/0050f6dafb75c4e31fb6dc42433a947f40a7a7b3))
- Update .gitignore to include test-reports and add test anomaly report script ([4d8c884](../../commit/4d8c884a2ddd4284d88dfd7a2a268ed4013335a3))
- Merge branch 'main' of https://github.com/nacorga/tracelog-sdk into release/20250920.3 ([6ea2984](../../commit/6ea29840d726aa72a1991ae31975e110dae5f4c4))
- Update CI/CD workflows and remove pre-release check script ([65fb463](../../commit/65fb4632044a1e9735898b0588dd94cf5f1dd97f))
- Merge pull request #3 from nacorga/release/20250920.2 ([0029dab](../../commit/0029dab49bd88cd075da58d71f300eb9b2c31912))
- Merge pull request #2 from nacorga/release/20250920.1 ([d15fe6b](../../commit/d15fe6b0ee72efe8a8c703c45c1f4bceb2c5b8ac))
- Merge pull request #1 from nacorga/feature/logging-system ([6ed3571](../../commit/6ed357105851a43c1a28c573fd01c90f5d7f0c3f))
- Update version to 0.0.1 and add release management scripts ([49e7304](../../commit/49e7304bceadfa1ad2dc13a4e14ebebb6f40cd1c))
- Update package.json to include browser build and modify README for CDN link ([7159e00](../../commit/7159e00971100fee6248921cbb72e27f79cbb6a9))
- E2e tests prettier ([abe98a1](../../commit/abe98a1fe76c6ee19e35d98493d6bb255a312157))
- Update E2E testing documentation and add Playwright test requirements ([9a1655c](../../commit/9a1655cb64f692fdfaf3ee25e5ee8a57e02b16df))
- Add GitHub Actions workflow for Copilot setup and update E2E testing guide with formatting instructions ([217128e](../../commit/217128eeebc6ad0ca9023da919836eb89fb433a4))
- Merge pull request #72 from nacorga/refactor/playwright-e2e-tests ([99dc343](../../commit/99dc3430faa776e6321093db1568521f980de614))
- Merge branch 'develop' of github.com:nacorga/tracelog-client into refactor/playwright-e2e-tests ([777d984](../../commit/777d984741541307a912e2a148a648dccd495583))
- Merge pull request #56 from nacorga/copilot/setup-copilot-instructions ([8b5a9fa](../../commit/8b5a9fabb0ac3d4b3d3d2b640ad970ffd8776099))
- Update CI workflow to improve caching and Node.js setup ([d119300](../../commit/d119300c9c520b0b2540d2993382ba0369980b64))
- Add CI workflow and remove old publish workflow ([78025c4](../../commit/78025c4af108ed701d76204952a93eb748fb01a6))
- Initial plan ([72512f6](../../commit/72512f6b907488c36199c8913fd79ded60315931))
- 0.7.1 [skip ci] ([efb2127](../../commit/efb2127c2cb46193b55b12537dc8d19832c5891f))
- Merge branch 'develop' of github.com:nacorga/tracelog-client ([272a697](../../commit/272a6979816698de68efc2ef671356ecd6f5bcd6))
- 0.7.0 [skip ci] ([a575bd2](../../commit/a575bd262a2ee4e4c43132eb4913e9f6ec1a472f))
- Merge pull request #41 from nacorga/release/20250907.1 ([327fe44](../../commit/327fe44efc72583259cba46ff86b3c4fb484bd4a))
- Merge pull request #46 from nacorga/codex/update-handlesessionendmessage-to-include-tabid ([422b341](../../commit/422b34114540a6cc16797f27a7c9b2143a62611f))
- Merge branch 'release/20250907.1' of github.com:nacorga/tracelog-client into codex/update-handlesessionendmessage-to-include-tabid ([a627d48](../../commit/a627d4868d14bbd47a1cfee7d39215706e0ca2a2))
- Merge pull request #45 from nacorga/codex/update-session-error-handling-logic ([41a8e82](../../commit/41a8e82efd3d2df53a2c995c6f87469b9500bc84))
- Merge branch 'release/20250907.1' of github.com:nacorga/tracelog-client into codex/update-session-error-handling-logic ([c49e7f2](../../commit/c49e7f267025f50796bde6c4fd73fcc91782cc4a))
- Merge pull request #47 from nacorga/codex/remove-explicit-endsession-call ([2f56963](../../commit/2f56963ba98cf7739c68b38f0938c2cb8076309f))
- Comment for clarity ([299a82a](../../commit/299a82ae99f1f462c22b7b847244e713cf31475f))
- Merge pull request #43 from nacorga/codex/update-handlesessionendmessage-logic ([599fcc0](../../commit/599fcc0046650ebbbc63a80774281b0281c8d14d))
- Merge branch 'release/20250907.1' of github.com:nacorga/tracelog-client into codex/update-handlesessionendmessage-logic ([f581049](../../commit/f581049f90d94be747341e9ff8a830ce8222d256))
- Merge pull request #42 from nacorga/codex/fix-session-cleanup-on-endsession ([c49b1da](../../commit/c49b1da556d757d94ebef4d9cebb3b05c1d2d1f0))
- Merge branch 'release/20250907.1' of github.com:nacorga/tracelog-client into codex/fix-session-cleanup-on-endsession ([9be6c78](../../commit/9be6c78a3f6f4685f2ab3d6f4fa7ca84ad697377))
- Merge pull request #44 from nacorga/codex/update-hasrecoverablesession-logic ([90ca484](../../commit/90ca4849919811d4eb3d5a1f2a587fe85d31fc4d))
- Add missing line break in hasRecoverableSession method for improved readability ([4495007](../../commit/44950073e677293bdf5bbc816895d5df6eccafae))
- Restart leader election after session end ([832a83f](../../commit/832a83ffeab0534a9cb1407379146e963f9aecd1))
- Clean session timers on failure ([e36a60b](../../commit/e36a60bfc23cde08ccf7a299d3e57744e652fdd8))
- Merge pull request #40 from nacorga/refactor/session-end-events ([b6ae668](../../commit/b6ae6687f65c6d9ff01c86fe075e05d12c1d2b84))
- 0.6.2 [skip ci] ([c3468b4](../../commit/c3468b4d0950175378198fda00ae8f5fb3ab3100))
- Merge pull request #39 from nacorga/release/20250822.1 ([0f643ab](../../commit/0f643abf69c3ca9279b67892cca81f5a9b80cab8))
- 0.6.1 [skip ci] ([6ea9b97](../../commit/6ea9b97c02f91150574daa0fc61946b4782c8a27))
- Merge pull request #38 from nacorga/hotfix/20250820.1 ([b02aa23](../../commit/b02aa23ff783c87d5c0a102272420153d5180016))
- Correct syntax error in README.md by replacing semicolon with a comma in errorSampling configuration ([325c10b](../../commit/325c10bcb139e2d67bcc2ff78e2c775bc583619f))
- 0.6.0 [skip ci] ([fe5b305](../../commit/fe5b305368c1b25c07226449d4627e027561da53))
- Merge pull request #37 from nacorga/release/20250818.1 ([459c557](../../commit/459c557228008ad4a5e8c891878ead85f386addc))
- Merge pull request #36 from nacorga/feature/error-handler ([aa09bd1](../../commit/aa09bd1b8e5da2c99a45cd67e3ecca4ebaff688b))
- Merge branch 'main' of github.com:nacorga/tracelog-client into feature/error-handler ([cb9b943](../../commit/cb9b943c2745f7dcb95f70883a0d94f34a24dbc9))
- 0.5.1 [skip ci] ([b20ef22](../../commit/b20ef22e1b118835fd1cb32da9cf79cd8be3756c))
- Merge pull request #35 from nacorga/hotfix/20250818.1 ([53469f7](../../commit/53469f7a93e589cbbc7cd0440cd4b39efb1f1b8d))
- 0.5.0 [skip ci] ([8e69203](../../commit/8e6920370226387c7cee353946b0dd9375815270))
- Merge pull request #34 from nacorga/release/20250811.1 ([7a6825f](../../commit/7a6825f76c73e046781ff8648c4e63473976b4f9))
- Merge pull request #33 from nacorga/feature/performance-metrics ([c99cc8d](../../commit/c99cc8d3d44851a7373d6543a7a197cf1021397c))
- 0.4.3 [skip ci] ([037d068](../../commit/037d0681c51e70edeebff9aa90d91230c3ad1221))
- Merge pull request #32 from nacorga/release/20250809.1 ([84f7039](../../commit/84f70396bea53cd2700ead8ce96fd3784a87019a))
- 0.4.2 [skip ci] ([6df055e](../../commit/6df055e01d3d7623671157413dfbcfd9e3bc1f5d))
- Merge pull request #31 from nacorga/release/20250808.1 ([89ef00e](../../commit/89ef00ebbaa7e69e682fc3d3d98074357438a193))
- 0.4.1 [skip ci] ([704c0fc](../../commit/704c0fc24fda2fe3beb76937f55e79e7f69b4c68))
- Merge pull request #30 from nacorga/release/20250807.1 ([f8f28a1](../../commit/f8f28a1c639f3fd6de08ab004df7447c67ed8f6b))
- Simplify logging for event and queue structures in QA mode ([21758e5](../../commit/21758e5b8f779d3aecca8414432675f72ac8a8f0))
- Remove default value comment for ipExcluded in ApiConfig interface ([4dea3ca](../../commit/4dea3caf49a2c9414531da7f9a14feef691311a8))
- 0.4.0 [skip ci] ([5169567](../../commit/5169567804dead5c67aff76cac7d46f30af3ff8c))
- Merge pull request #29 from nacorga/release/20250806.2 ([86f1d91](../../commit/86f1d917733e58e77ca346a5f5d6e782df6d0299))
- 0.3.7 [skip ci] ([696edf8](../../commit/696edf8a5e80e1e9c8f3aac614e05d1d3df7d9e1))
- Merge pull request #28 from nacorga/release/20250806.1 ([f52a7a1](../../commit/f52a7a1eebe5e27528955b67a43c35a6d465e4ba))
- 0.3.6 [skip ci] ([6d6f196](../../commit/6d6f1968568e512ad2747f7ddf3483279ce513f1))
- Merge pull request #27 from nacorga/release/20250805.1 ([f9ec5a0](../../commit/f9ec5a06f8143617c7f23316879b02f1ce0c9603))
- 0.3.5 [skip ci] ([ec1ea89](../../commit/ec1ea89a048cd77ca7b7f6ac590eced07b79d5ac))
- Merge pull request #26 from nacorga/release/20250804.1 ([55870ed](../../commit/55870edfe8d97d30a69f79bbec8e56f58f423ce2))
- 0.3.4 [skip ci] ([ae785f1](../../commit/ae785f15e96791bf8fe241165c9a490c499a1d26))
- Merge pull request #25 from nacorga/release/20250801.1 ([42e292c](../../commit/42e292c64e503f17258a25f027b6e7d6bdcf6723))
- 0.3.3 [skip ci] ([15e2572](../../commit/15e2572f073935b2f4ed921a6b68e4aab1385681))
- Merge branch 'main' of github.com:nacorga/tracelog-client ([5250e37](../../commit/5250e374cb8183552f81bdc7608df0feb9fecf9d))
- 0.3.2 [skip ci] ([bcad541](../../commit/bcad541aab24beb4ff8df60957a0a2b45d756189))
- 0.3.1 [skip ci] ([2b061be](../../commit/2b061be50c077469d19ee485d91e924259c838d2))
- 0.3.0 [skip ci] ([8d067b0](../../commit/8d067b025873fd2c53fe10d3eaade9ba15544ab0))
- Merge pull request #24 from nacorga/refactor/clean-app ([bf6b315](../../commit/bf6b315cd92461fa348a95eaf6a6a6b38c33cff1))
- Merge branch 'main' of github.com:nacorga/tracelog-client into refactor/clean-app ([997b14d](../../commit/997b14d4b7e3ba9bef5bb3168a8b2c9ec13b225c))
- Remove benchmark scripts from the project ([f938632](../../commit/f938632b2c8750d522f9a205579726c367504847))
- 0.3.0 [skip ci] ([4e6854c](../../commit/4e6854c052513b31564ad4d8f726b57391787688))
- Merge pull request #23 from nacorga/codex/refactorizar-libreria-npm-para-simplificar-estructura ([f9ac9f7](../../commit/f9ac9f722b08e341c34f82e306971cb5a21cbe9b))
- Merge pull request #22 from nacorga/codex/remove-apiurl-and-remoteconfigapiurl-from-config ([d86a229](../../commit/d86a2299c754bc4839f38ce353ffdb058832066f))
- 0.2.6 [skip ci] ([8abcc15](../../commit/8abcc15a2fcb998ea1d31741a0bf6fc592788c0a))
- Merge pull request #21 from nacorga/feature/20250724.2 ([e54ca93](../../commit/e54ca93c7712c649901f6c60f64be2332d4069f7))
- 0.2.5 [skip ci] ([24c3458](../../commit/24c34587e67853ab662106f5709f5e3c0dcaddf6))
- Merge pull request #20 from nacorga/hotfix/20250724.1 ([10c1768](../../commit/10c1768342a4b07cd6af6dd59e7d1cc29254be42))
- 0.2.4 [skip ci] ([1a23575](../../commit/1a2357594cc16cacd9adfd6c8155e3d3d14b3ed7))
- Merge pull request #19 from nacorga/release/20250724.1 ([8b2999c](../../commit/8b2999c300ef15c3506c9564e6e0be3f69ff3682))
- Merge pull request #18 from nacorga/codex/move-apiconfig-properties-to-root ([c5ec04d](../../commit/c5ec04dfb93102e73809453d87f54c41067afed4))
- 0.2.3 [skip ci] ([d305a61](../../commit/d305a6100bc7a005167751b4a49bd39e52129f99))
- Update README ([2be3fc2](../../commit/2be3fc2edc82a870cb2100d67960cf40bc4e7aa2))
- 0.2.2 [skip ci] ([6930c0b](../../commit/6930c0bc18dc359589c1c24659e1ec686bb1cd88))
- 0.2.1 [skip ci] ([4b9339c](../../commit/4b9339c79fa979ca809b38dec6159a2c6e0e673f))
- Merge pull request #17 from nacorga/release/20250722.2 ([0cc9bf7](../../commit/0cc9bf7d1593fa51b7850f5a1017ccb4bf8b70c5))
- 0.2.0 [skip ci] ([9a9ac14](../../commit/9a9ac140538b6707def74339a0dbc901255b808c))
- Merge pull request #16 from nacorga/develop ([2f3ab9d](../../commit/2f3ab9dedc317771599536d7a0ef7392bb1b8523))
- Merge pull request #15 from nacorga/codex/extract-builddynamicapiurl-to-utility-module ([2439110](../../commit/2439110e74c8115e7cd71f97dcab99206716e87d))
- Merge branch 'develop' of github.com:nacorga/tracelog-client into codex/extract-builddynamicapiurl-to-utility-module ([352324a](../../commit/352324a2947de1841809704fc807f9d85750f725))
- Merge pull request #14 from nacorga/codex/validate-customapiurl-protocol-and-allowhttp ([fe52d56](../../commit/fe52d56779f83c888bdad6edfad04dee42b40aad))
- Merge pull request #13 from nacorga/codex/generar-tests-e2e-con-playwright ([e3c6cf0](../../commit/e3c6cf0d85fdfc0a91582e7860452064f07b3d1f))
- Merge pull request #12 from nacorga/dvj159-codex/permitir-eventos-del-sdk-a-servidor-cliente ([a4e5749](../../commit/a4e57498c33c60c15db91710a57565008f86cd32))
- Merge pull request #11 from nacorga/codex/investigar-manejo-de-sesiones-con-excluded-paths ([d7949a9](../../commit/d7949a9052f50201338b0a48897ba26f662f5136))
- 0.1.0 [skip ci] ([06c6221](../../commit/06c62214f9cf5bd8fbd4131d97c6a09ee333f3ae))
- Merge pull request #10 from nacorga/feature/benchmarking ([9c5e3ac](../../commit/9c5e3aca200b7307d829ceb3579b82675f890c64))
- 0.0.6 [skip ci] ([dc122fc](../../commit/dc122fc5adcd727710e8ea99ccc0fac5ffd86dd2))
- Enhance .versionrc.json to ensure ALL commits appear in changelog ([20a11bb](../../commit/20a11bb69acb571dc1d07b566098445e5b6e1c13))
- 0.0.5 [skip ci] ([306bce8](../../commit/306bce8341c2679b00582351bd03c00af5f709a8))
- Remove browser build from build:all script ([7393fcb](../../commit/7393fcbf427568edb65025f7d1124a1c3576c499))
- 0.0.4 [skip ci] ([077d442](../../commit/077d442ed3be27b3e3e8d72994e4e13203cf89d7))
- Remove release check step from GitHub Actions workflow ([28b4560](../../commit/28b4560f982a4397957ce6e79f0cf3ae03a8bb85))
- Merge pull request #9 from nacorga/feature/package-optimization ([a229330](../../commit/a22933062ebc4e8ccf72cf773f3f09bb1459cc1f))
- Update .versionrc.json for correct repository links  and improve GitHub Actions workflow for release management ([d89756e](../../commit/d89756ed7f27e4f3da3c89d99f50aa88e2252441))
- Merge branch 'main' of github.com:nacorga/tracelog-client into feature/package-optimization ([d844520](../../commit/d8445202d188cb0c2093e2dce8566a9ed2da460e))
- Include both ESM and CJS directories, modify tsconfig.json to exclude tests, and disable sourcemaps in vite.config.mjs ([d3445cb](../../commit/d3445cb45c50d4997230f571a00b13cecd91e796))
- 0.0.3 [skip ci] ([10321d3](../../commit/10321d3f241bfef0883a1c8082eadf65d2b23a71))
- Merge pull request #4 from nacorga/refactor/core-methods-and-types ([e96ab6f](../../commit/e96ab6f62489e63d11b2e547e0736ae61105894c))
- Merge pull request #8 from nacorga/codex/refactor-safe-local-storage-serialization ([7c36c1e](../../commit/7c36c1e87be572210dff06d72acb63ecafa398c4))
- Merge pull request #7 from nacorga/codex/modify-validateglobalmetadata-method ([1f8a041](../../commit/1f8a041c4da52f2801a81a9502f595b829d7b3d7))
- Merge branch 'refactor/core-methods-and-types' of github.com:nacorga/tracelog-client into refactor/core-methods-and-types ([5115509](../../commit/5115509f94b93e0d2ed3e4ad77c62554df453e7e))
- Merge pull request #6 from nacorga/codex/extract-safelocalstorage-class-and-refactor-datasender ([309b71f](../../commit/309b71ffc356ae401c2b9cb975c8b86766564a93))
- Merge branch 'refactor/core-methods-and-types' of github.com:nacorga/tracelog-client into refactor/core-methods-and-types ([09ffb09](../../commit/09ffb092e7f7c1b4441fa40317629a7e643a72fc))
- Merge pull request #5 from nacorga/codex/implement-cleanup-method-in-tracking-class ([5c2542c](../../commit/5c2542ca139a3c71ae65a4baf463eb8550f739b9))
- Refactor API exports, rename event properties for consistency and improve type definitions ([7e743ba](../../commit/7e743ba5b0a1e0cc0161fe078630bc93fa06b6a8))
- Translate comments and console messages in rc-manager.js to English for consistency ([d9f05ae](../../commit/d9f05ae997b693df9c38cb20aa5406474e6b081c))
- 0.0.2 [skip ci] ([2797666](../../commit/27976662b85639ee671efff47031b53eb63d8b12))
- Merge pull request #3 from nacorga/feature/integration-improves ([0eb7fab](../../commit/0eb7fabc8e976dd3e3026f0bf4bdda390f25083e))
- Release changelog 0.0.1 ([0ef5e23](../../commit/0ef5e23a8d61069679010cf4db1ce421044e5f36))
- Update end-to-end test command to include additional Playwright reporters ([3ac9baf](../../commit/3ac9baffe114758345253a55f710ae6cfca8a269))
- Remove Playwright HTML report upload step from CI workflows ([a5d39d2](../../commit/a5d39d2a4e48e6713bf7890cface01186c1873dd))
- Update path for Playwright report upload in CI workflows ([42db03b](../../commit/42db03b83dc31815d92b9c8dbda6c757686fe272))
- Upgrade actions/upload-artifact to version 4 in CI workflows ([7929faf](../../commit/7929fafb0a48490a847e6a73aadc60a60db484ea))
- Update Playwright report upload process in CI workflows ([8ec79a8](../../commit/8ec79a826cedf719f19ce8a96fa4ec20715af6ab))
- Enhance CI workflows with caching for NPM registry and Playwright browsers ([ba3f5a5](../../commit/ba3f5a570c59be0d5ccd645ae0e92fe687b93564))
- Comment out Playwright installation and caching steps in CI workflow ([e2fc1e3](../../commit/e2fc1e3495b2815b9fb09a4fef7e80dbb36ce050))
- Update Playwright configuration ([23f1b79](../../commit/23f1b795e23687fa23c075ee3ea6d2cbf0625bf9))
- Merge branch 'feature/tracelog-client' of https://github.com/nacorga/tracelog into feature/tracelog-client ([94debaf](../../commit/94debaf9779910f9d69dfb7f88e2e7535a260b0c))
- Merge pull request #2 from nacorga/codex/store-and-remove-click-handler-reference ([fac9a5d](../../commit/fac9a5da26c1f94bb1f961f0ee749aeea8ee0d28))
- Add Vite configuration for building TraceLog library and update caching key in CI workflow ([b163c89](../../commit/b163c89dc49c01c9411e1676654dc8eab640cdf4))
- Update Vite configuration and caching for node_modules and build artifacts ([bd93e1d](../../commit/bd93e1dfd86f2d4cc70fd710d3a6993dbfec2bcf))
- Comment out Playwright installation and E2E test ([571304d](../../commit/571304deeab9f04e1896e10eb70f2dadc6db6e27))
- Update Playwright configuration for improved CI performance ([df05ff1](../../commit/df05ff1a72f590d675a2eeedca5c19a492f57605))
- Commitlint and husky ([765dbe7](../../commit/765dbe7b93bd882171970ec937f737b82fb90de1))
- Update ESLint configuration to include Prettier, modify .gitignore for test results, and add .prettierignore file for better formatting control ([4c35e74](../../commit/4c35e740bd5f0b56ef66e9befe1e47437cb4591a))
- Add linting step to CI workflows for code quality assurance ([938f99a](../../commit/938f99a6a35f13aca1ae4123454321a259f8d237))
- Eslint added ([00ee018](../../commit/00ee0188f5ea6ee46255f10f98715fd2bb949e6c))
- Feature: app works ([8fbc555](../../commit/8fbc555735256c9f8e9efb6f289eba072167c8b3))

### 👥 Contributors

Thanks to all contributors who made this release possible:

- copilot-swe-agent[bot]
- GitHub Action
- github-actions
- Ignacio Cortes Garcia
- Nacho

