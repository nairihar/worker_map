const { WorkerMap } = require('worker_map');
const { workerData } = require('worker_threads');

const accountMap = new WorkerMap(workerData.sharedAccount);

setInterval(() => {
  const key = `wallets_${workerData.coin_name}`;

  accountMap.set(key, accountMap.get(key) * 1.2);
}, 50);
