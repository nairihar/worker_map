const { WorkerMap } = require('worker_map');
const { Worker, workerData } = require('worker_threads');

const map = new WorkerMap(workerData.mapBuffer);

setInterval(() => {
  console.log(`(worker): Yes we have ${map.size()} members!`);
}, 1000);

map.set(3, 'Neo');

console.log('(worker): I\'ve just added 3th member!');

new Worker('./cleaner.js', {
  workerData: {
    mapBuffer: map.toSharedBuffer(),
  },
});
