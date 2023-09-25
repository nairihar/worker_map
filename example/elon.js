const WorkerHash = require('../src/worker_map');
const { Worker } = require('worker_threads');


const hash = new WorkerHash({
    owner: 'Elon',
    wallets_usd_bank: 100,
    wallets_eth: 0,
});

account.set('wallets_doge', 0);
account.set('armenian_name', 'Էլոն Մասկ');

setInterval(() => {
    account.set('wallets_usd_bank', account.get('wallets_usd_bank') - 1);
    account.set('wallets_eth', account.get('wallets_eth') + 0.6);
    account.set('wallets_doge', account.get('wallets_doge') + 0.4);
}, 50);


new Worker('./earn_in_crypto', {
    workerData: {
        coin_name: 'doge',
        sharedAccount: account.toSharedBuffer(),
    },
});

new Worker('./earn_in_crypto', {
    workerData: {
        coin_name: 'eth',
        sharedAccount: hash.toSharedBuffer(),
    },
});

setInterval(() => {
    console.log(account.toObject());

    if (account.get('wallets_usd_bank') <= 1) {
        process.exit(0);
    }
}, 30);