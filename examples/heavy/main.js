const { WorkerMap } = require('worker_map');
const { Worker } = require('worker_threads');

const accountMap = new WorkerMap();

accountMap.set('owner', 'Elon');
accountMap.set('wallets_eth', 0);
accountMap.set('wallets_doge', 0);
accountMap.set('wallets_usd_bank', 100);
accountMap.set('armenian_name', 'Էլոն Մասկ');

setInterval(() => {
  accountMap.set('wallets_usd_bank', accountMap.get('wallets_usd_bank') - 1);
  accountMap.set('wallets_eth', accountMap.get('wallets_eth') + 0.6);
  accountMap.set('wallets_doge', accountMap.get('wallets_doge') + 0.4);
}, 50);

new Worker('./worker', {
  workerData: {
    coin_name: 'doge',
    sharedAccount: accountMap.toSharedBuffer(),
  },
});

new Worker('./worker', {
  workerData: {
    coin_name: 'eth',
    sharedAccount: accountMap.toSharedBuffer(),
  },
});

setInterval(() => {
  console.log(accountMap.toObject());

  if (accountMap.get('wallets_usd_bank') <= 1) {
    process.exit(0);
  }
}, 30);
