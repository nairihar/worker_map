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

## Limitations and Considerations

- **Single Level Objects**: ThreadShare is designed to work with one level objects. Nested objects and arrays are not supported directly within shared objects. You can, however, create fields that hold other objects inside the shared object.

- **Reference Handling**: JavaScript does not allow direct manipulation of references. As a result, ThreadShare doesn't directly handle references to nested objects or arrays. Be aware of this limitation when designing your shared objects.

- **Accessing Shared Data**: When logging a shared object, you won't see the complete output. To access the actual shared data, access the `$target` field of the shared object. For shared arrays, you can access the underlying `SharedArrayBuffer` using the `$buffer` field.

### Accessing Plain Object and SharedArrayBuffer

```js
// Accessing the plain object inside a shared object
const plainObject = sharedObject.$target;

// Accessing the SharedArrayBuffer inside a shared array
const sharedArrayBuffer = sharedArray.$buffer;
```

## How ThreadShare Works Internally

ThreadShare employs an internal mechanism to manage shared data and ensure synchronization between the main process and worker threads. This section provides insights into the underlying workflow of the library.

1. **Locking Shared Memory**: Every time you attempt to access or modify a field within a shared object, ThreadShare initiates a process to lock the shared memory. This prevents other threads from accessing the memory simultaneously, reducing the risk of data corruption or race conditions.

2. **Serialization to String**: To effectively manage data sharing, ThreadShare internally serializes the shared object's data as a string representation. This string representation contains the entire state of the shared object, including its custom fields.

3. **Storage as Numbers**: The serialized string representation is then converted into an array of numbers using an Int32Array. This array of numbers, representing the serialized data, is stored in the underlying shared memory.

4. **Access and Modification**: When you access a field within the shared object, ThreadShare locks the memory, decodes the stored numbers to reconstruct the serialized string, and parses this string to recreate the object. The requested field's value is then retrieved or modified accordingly.

5. **Unlocking Shared Memory**: After accessing or modifying the shared object's fields, ThreadShare releases the memory lock, allowing other threads to access the shared memory area.

