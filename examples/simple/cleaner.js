const { WorkerMap } = require('worker_map');
const { workerData } = require('worker_threads');

const map = new WorkerMap(workerData.mapBuffer);

setInterval(() => {
  const entries = map.entries();
  if (entries.length) {
    map.delete(entries[0][0]);
    console.log('(cleaner): I\'ve just removed one member!');
  }
}, 1500);
