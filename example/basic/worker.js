const { workerData } = require('worker_threads');
const { WorkerMap } = require('../../src/worker_map');

const map = new WorkerMap(workerData.mapBuffer);
console.log(map.get('balance')); // 100

// The change will also be reflected in the main process
map.set('balance', 200);