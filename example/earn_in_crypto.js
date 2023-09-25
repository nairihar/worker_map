const ThreadShare = require('../src/worker_map');
const { workerData } = require('worker_threads');

const account = new ThreadShare(workerData.sharedAccount);

setInterval(() => {
  const key = `wallets_${workerData.coin_name}`;

  account.set(key, account.get(key) * 1.2);
}, 50);
