const { Worker } = require('worker_threads');
const { WorkerMap } = require('../../src/worker_map');

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