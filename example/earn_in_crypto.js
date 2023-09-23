const { getSharedObject } = require('threadshare');
const { workerData } = require('worker_threads');

const account = getSharedObject(workerData.sharedAccount);

setInterval(() => {
  account[`wallets_${workerData.coin_name}`] *= 1.2;
}, 50);
