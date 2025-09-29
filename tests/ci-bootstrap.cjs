'use strict';

const { URL, URLSearchParams } = require('node:url');
const { TextEncoder, TextDecoder } = require('node:util');
let workerSharedArrayBuffer;
let workerAtomics;

try {
  // worker_threads exposes SharedArrayBuffer and Atomics even when not globally available
  const workerThreads = require('node:worker_threads');
  workerSharedArrayBuffer = workerThreads.SharedArrayBuffer || workerThreads.SHAREDARRAYBUFFER;
  workerAtomics = workerThreads.Atomics;
} catch {
  workerSharedArrayBuffer = undefined;
  workerAtomics = undefined;
}

const defineIfMissing = (target, key, value) => {
  if (typeof value === 'undefined') {
    return;
  }
  if (typeof target[key] === 'undefined') {
    Object.defineProperty(target, key, {
      value,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }
};

const noopGet = () => undefined;

defineIfMissing(globalThis, 'window', globalThis);
defineIfMissing(globalThis, 'global', globalThis);
defineIfMissing(globalThis, 'self', globalThis);
defineIfMissing(globalThis, 'get', noopGet);

const windowObject = globalThis.window;
if (windowObject && typeof windowObject.get === 'undefined') {
  Object.defineProperty(windowObject, 'get', {
    value: noopGet,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}

defineIfMissing(globalThis, 'TextEncoder', TextEncoder);
defineIfMissing(globalThis, 'TextDecoder', TextDecoder);
defineIfMissing(globalThis, 'URL', URL);
defineIfMissing(globalThis, 'URLSearchParams', URLSearchParams);
defineIfMissing(globalThis, 'SharedArrayBuffer', workerSharedArrayBuffer);
defineIfMissing(globalThis, 'Atomics', workerAtomics);

if (typeof globalThis.DOMException === 'undefined') {
  try {
    const util = require('node:util');
    if (typeof util.DOMException === 'function') {
      defineIfMissing(globalThis, 'DOMException', util.DOMException);
    } else {
      throw new Error('DOMException not provided by util');
    }
  } catch {
    class DOMExceptionPolyfill extends Error {
      constructor(message, name) {
        super(message);
        this.name = name || 'DOMException';
      }
    }
    defineIfMissing(globalThis, 'DOMException', DOMExceptionPolyfill);
  }
}
