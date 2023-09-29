const LOCKED = 1;
const UNLCOKED = 0;

function lock(buffer) {
  for (;;) {
    if (Atomics.compareExchange(buffer, 0, UNLCOKED, LOCKED) === UNLCOKED) {
      return;
    }
    Atomics.wait(buffer, 0, LOCKED);
  }
}

function unlock(buffer) {
  if (Atomics.compareExchange(buffer, 0, LOCKED, UNLCOKED) !== LOCKED) {
    throw new Error(
      'Mutex is in inconsistent state: unlock on unlocked Mutex.',
    );
  }

  Atomics.notify(buffer, 0, 1);
}

module.exports = {
  lock,
  unlock,
  LOCKED,
  UNLCOKED,
};
