# threadshare

ThreadShare is a JavaScript library that provides an abstraction for Node.js worker threads, allowing you to create and share objects between worker threads and the main process. This simplifies the process of managing shared data and communication between threads.

## Installation

```
npm i -S threadshare
```

## Getting Started

### Creating a Shared Object

ThreadShare enables you to create shared objects that can be accessed by both the main process and worker threads. To create a shared object, use the createSharedObject method:

```js
// main.js
const ThreadShare = require('threadshare');
const account = ThreadShare.createSharedObject();
```

### Accessing a Shared Object in a Worker Thread

To access a shared object within a worker thread, you need to retrieve it using the getSharedObject method and providing the shared object identifier:

```js
// worker.js
const ThreadShare = require('threadshare');
const { workerData } = require('worker_threads');

// Inside the worker thread
const account = ThreadShare.getSharedObject(workerData.sharedAccount);
```

### Communication Between Main Process and Worker Thread

Using ThreadShare's shared objects, you can easily communicate and share data between the main process and worker threads. Any modifications made to the shared object are automatically synchronized across all threads.

**main.js**
```js
const ThreadShare = require('threadshare');
const { Worker } = require('worker_threads');

const account = ThreadShare.createSharedObject();

// Modify the shared object
account.owner = 'Elon';

// Create a worker thread and pass the shared object to it
const worker = new Worker('worker.js', {
  workerData: {
    sharedAccount: account.$buffer,
  }
});
```

**worker.js**
```js
const ThreadShare = require('threadshare');
const { workerData } = require('worker_threads');

const account = ThreadShare.getSharedObject(workerData.sharedAccount);

// Access and modify the shared object
console.log(account.owner); // Output: 'Elon'

account.balance = 1000;

// The change in balance will also be reflected in the main process
```
