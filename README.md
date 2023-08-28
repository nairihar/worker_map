# threadshare

ThreadShare is a JavaScript library that provides an abstraction for Node.js worker threads, allowing you to create and share objects between worker threads and the main process. This simplifies the process of managing shared data and communication between threads.

## Installation

```
npm i -S threadshare
```

## Getting Started

### Creating a Shared Object

ThreadShare enables you to create shared objects that can be accessed by both the main process and worker threads. To create a shared object, use the createSharedObject method:

```nodejs
// main.js
const ThreadShare = require('threadshare');
const sharedAccount = ThreadShare.createSharedObject();
});
```

### Accessing a Shared Object in a Worker Thread

To access a shared object within a worker thread, you need to retrieve it using the getSharedObject method and providing the shared object identifier:

```nodejs
// worker.js
const ThreadShare = require('threadshare');
const { workerData } = require('worker_threads');

// Inside the worker thread
const sharedAccount = ThreadShare.getSharedObject(workerData.account);
```

### Communication Between Main Process and Worker Thread

Using ThreadShare's shared objects, you can easily communicate and share data between the main process and worker threads. Any modifications made to the shared object are automatically synchronized across all threads.

**main.js**
```nodejs
const ThreadShare = require('threadshare');

const sharedAccount = ThreadShare.createSharedObject();

// Modify the shared object
sharedAccount.owner = 'Elon';

// Create a worker thread and pass the shared object to it
const { Worker } = require('worker_threads');
const worker = new Worker('worker.js', {
  workerData: {
    sharedAccount: account.$buffer,
  }
});
```

**worker.js**
```nodejs
const ThreadShare = require('threadshare');
const { workerData } = require('worker_threads');

const sharedAccount = ThreadShare.getSharedObject(workerData.sharedAccount);

// Access and modify the shared object
console.log(sharedAccount.owner); // Output: 'Elon'

sharedAccount.balance = 1000;

// The change in balance will also be reflected in the main process
```
