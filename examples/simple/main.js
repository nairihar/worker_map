const { WorkerMap } = require('worker_map');
const { Worker } = require('worker_threads');

const map = new WorkerMap();

map.set(1, 'David');
map.set(2, 'James');

console.log(`(main): I've added ${map.size()} members!`);

new Worker('./worker.js', {
  workerData: {
    mapBuffer: map.toSharedBuffer(),
  },
});

setInterval(() => {
  console.log(`(main): I can see ${map.size()} members!`);
}, 1000);

setTimeout(() => {
  process.exit(0);
}, 7000);
