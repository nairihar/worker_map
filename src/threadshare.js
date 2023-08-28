const decoder = new TextDecoder('utf8');
const encoder = new TextEncoder('utf8');

const { lock, unlock, UNLCOKED } = require('./mutex');

const DEFAULT_OBJECT_SIZE = 1000; // total characters of stringified object

function getSharedMemoryBuffer(sharedBuffer) {
    return new Int32Array(sharedBuffer);
}

function calculateUsedBufferLength(valueBuffer) {
    // exclude first item
    return valueBuffer.reduce((acc, value) => (
        acc + (value ? 1 : 0)
    ), -1);
}

function loadPlainSharedObject(valueBuffer) {
    const usedBufferLength = calculateUsedBufferLength(valueBuffer);
    const decodeBuffer = new Uint8Array(usedBufferLength);

    for (let i = 1; i <= usedBufferLength; i++) {
        if (valueBuffer[i]) {
            decodeBuffer[i - 1] = valueBuffer[i];
        }
    }

    return JSON.parse(
        decoder.decode(decodeBuffer)
    );
}

function saveObjectInBuffer(sharedObject, valueBuffer) {
    const objString = JSON.stringify(sharedObject);
    const encodeBuffer = new Uint8Array(objString.length);
    encoder.encodeInto(objString, encodeBuffer)

    for (let i = 0; i < objString.length; i++) {
        valueBuffer[i + 1] = encodeBuffer[i];
    }

    for (let j = objString.length + 1; j < valueBuffer.length; j++) {
        valueBuffer[j] = 0;
    }
}

function creteObjectProxyHandlers(sharedBuffer, valueBuffer) {
    return {
        set(objectProxy, prop, value) {
            if (Number.isNaN(value) || value === undefined) {
                value = null;
            }

            lock(valueBuffer);

            const sharedObject = loadPlainSharedObject(valueBuffer)
            sharedObject[prop] = value;

            saveObjectInBuffer(sharedObject, valueBuffer);

            unlock(valueBuffer);
        },

        get(target, key) {
            if (key === '$buffer') {
                return sharedBuffer;
            }

            lock(valueBuffer);
            
            const sharedObject = loadPlainSharedObject(valueBuffer);

            unlock(valueBuffer);


            if (key === '$target') {
                return sharedObject;
            }

            return sharedObject[key];
        },
    };
}

function createSharedObject(size=DEFAULT_OBJECT_SIZE) {
    const sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * size);
    const valueBuffer = getSharedMemoryBuffer(sharedBuffer);

    valueBuffer[0] = UNLCOKED; // first value used for locking and unlocking

    const emptySharedObject = {};

    saveObjectInBuffer(emptySharedObject, valueBuffer);

    const handlers = creteObjectProxyHandlers(sharedBuffer, valueBuffer);

    return new Proxy(emptySharedObject, handlers);
}

function getSharedObject(sharedBuffer) {
    const valueBuffer = getSharedMemoryBuffer(sharedBuffer);

    lock(valueBuffer);
    const sharedObject = loadPlainSharedObject(valueBuffer);
    unlock(valueBuffer);

    const handlers = creteObjectProxyHandlers(sharedBuffer, valueBuffer);

    return new Proxy(sharedObject, handlers);
}

module.exports = {
    createSharedObject,
    getSharedObject
};