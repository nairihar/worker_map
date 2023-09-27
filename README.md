![](https://img.shields.io/badge/dependencies-none-brightgreen.svg)
![](https://img.shields.io/npm/dt/worker_map.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/nairihar/worker_map/badge.svg)](https://snyk.io/test/github/nairihar/funthreads)
![](https://img.shields.io/npm/l/worker_map.svg)

# worker_map

A simple abstraction for Node.js `worker_threads`, allowing you to create and share a `Map (hash table)` between worker threads and the main process. This simplifies the process of managing shared data and communication between worker threads.

![](https://topentol.sirv.com/github/worker_map.jpg)

Under the hood, the library uses `SharedArrayBuffer` to create shared memory, enabling seamless data sharing between threads. Additionally, it uses `Atomics` mechanism to implement a **mutex**, ensuring **thread safety** and preventing race conditions during data access and manipulation.

## Installation

```
npm i worker_map
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

### `map.get(key):`
```
const name = map.get('name');
```
### `map.set(key, value)`
```
map.set('name', 'John');
```
### `map.delete(key):`
```
map.delete('name'); // true
map.delete('something'); // false because doesn't exist
```
### `map.has(key)`
```
map.has('name'); // true
map.has('country'); // false
```
### `map.size()`
```
map.has('size'); // 1
```
### `map.keys()`
```
map.keys(); // [ 'name' ]
```
### `map.toSharedBuffer()`
```
const buffer = map.toSharedBuffer();
const sameMap = new WorkerMap(buffer);
```
### `map.toObject()`
```
const mapObject = map.toObject();
mapObject.name; // 'John'
```

## TODO
- `map.clear()`
- `map.entries()`
- `map.forEach()`
- Currently, when performing an action on the map, it temporarily locks the entire map, loads the necessary data, and then unlocks the map, allowing other threads to access it. However, this approach is suboptimal. It would be more efficient if we could lock only the specific portion of memory required for the particular operation.

## Limitations

Please be aware of the following limitations when using our library:
1. **Functions:** Function types are not supported.
2. **NaN Values:** NaN values are not supported.
