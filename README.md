![](https://img.shields.io/badge/dependencies-none-brightgreen.svg)
![](https://img.shields.io/npm/dt/worker_map.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/nairihar/worker_map/badge.svg)](https://snyk.io/test/github/nairihar/funthreads)
![](https://img.shields.io/npm/l/worker_map.svg)

# worker_map

An simple abstraction for Node.js `worker_threads`, allowing you to create and share `Map (hash table)` between worker threads and the main process. This simplifies the process of managing shared data and communication between worker threads.

![](https://topentol.sirv.com/github/worker_map.jpg)

## Installation

```
npm i threadshare
```

## Basic Example
First, let's create a simple hash map structure in main process, then create a worker thread and share the hash.

```js
// main.js
const { Worker } = require('worker_threads');
const { WorkerMap } = require('worker_map');

const map = new WorkerMap();
map.set('balance', 100); // sync operation

new Worker('./worker.js', {
  workerData: {
    mapBuffer: map.toSharedBuffer(),
  },
});

setTimeout(() => {
    console.log(map.get('balance')); // 200
}, 50);

```

Now, let's access the shared hash map structure in the worker thread.

```js
// worker.js
const { WorkerMap } = require('worker_map');
const { workerData } = require('worker_threads');

const map = new WorkerMap(workerData.mapBuffer);
console.log(map.get('balance')); // 100

// The change will be reflected in the main process as well
map.set('balance', 200);
```

## Instance methods

### `map.get(key)`
### `map.set(key, value)`
### `map.delete(key)`
### `map.has(key)`
### `map.size()`
### `map.keys()`
### `map.toSharedBuffer()`
### `map.toObject()`

## TODO
### `map.clear()`
### `map.entries()`
### `map.forEach()`