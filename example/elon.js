const ThreadShare = require('threadshare');
const { Worker } = require('worker_threads');

const account = ThreadShare.createSharedObject();

account.owner = 'Elon';
account.wallets_usd_bank = 100;
account.wallets_eth = 0;
account.wallets_doge = 0;

setInterval(() => {
    account.wallets_usd_bank -= 1;

    account.wallets_eth += 0.6;
    account.wallets_doge += 0.4;
}, 50);


new Worker('./earn_in_crypto', {
    workerData: {
        coin_name: 'doge',
        sharedAccount: account.$buffer,
    },
});

new Worker('./earn_in_crypto', {
    workerData: {
        coin_name: 'eth',
        sharedAccount: account.$buffer,
    },
});

setInterval(() => {
    console.log(account.$target);

    if (account.wallets_usd_bank <= 1) {
        process.exit(0);
    }
}, 30);