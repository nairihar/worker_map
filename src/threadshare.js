const decoder = new TextDecoder('utf8');
const encoder = new TextEncoder('utf8');

const { lock, unlock, UNLCOKED } = require('./mutex');

const DEFAULT_OBJECT_BYTE_LENGTH = 1000; // total characters of stringified object
const MAX_OBJECT_BYTE_LENGTH = 10000; // max characters length for the stringified object

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

function adjustSharedBufferGrow(sharedBuffer, sharedObject) {
    const objectByteLength = JSON.stringify(sharedObject).length * Int32Array.BYTES_PER_ELEMENT;

    const diff = sharedBuffer.byteLength - objectByteLength;

    if (diff <= 0) {
        if (!sharedBuffer.grow) {
            throw new Error('No more space, create a new bigger shared object or use Node >= v20 to support auto grow.');
        }
        sharedBuffer.grow(sharedBuffer.byteLength + Math.abs(diff) + 10);
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

            adjustSharedBufferGrow(sharedBuffer, sharedObject);

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

function createSharedObject(length=DEFAULT_OBJECT_BYTE_LENGTH) {
    const sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * length, {
        maxByteLength: MAX_OBJECT_BYTE_LENGTH,
    });
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