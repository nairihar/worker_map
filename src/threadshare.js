const util = require('util');
const decoder = new TextDecoder('utf8');
const encoder = new TextEncoder('utf8');

const { lock, unlock, UNLCOKED } = require('./mutex');

const DEFAULT_OBJECT_BYTE_LENGTH = 4096; // total characters of stringified object (2^12)
const MAX_OBJECT_BYTE_LENGTH = 4294967296; // max characters length for the stringified object (2^32)

const PLAIN_SHARED_OBJECT = Symbol('PLAIN_SHARED_OBJECT');
const SHARED_OBJECT_BUFFER = Symbol('SHARED_OBJECT_BUFFER');

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

function calculateStringByteLength(string) {
    return encoder.encode(string).length;
}

function saveObjectInBuffer(sharedObject, valueBuffer, objString) {
    objString ??= JSON.stringify(sharedObject);

    const stringByteLength = calculateStringByteLength(objString);
    const encodeBuffer = new Uint8Array(stringByteLength);
    encoder.encodeInto(objString, encodeBuffer)

    for (let i = 0; i < stringByteLength; i++) {
        valueBuffer[i + 1] = encodeBuffer[i];
    }

    for (let j = stringByteLength + 1; j < valueBuffer.length; j++) {
        valueBuffer[j] = 0;
    }
}

function adjustSharedBufferGrow(sharedBuffer, sharedObject) {
    const objectByteLength = calculateStringByteLength(JSON.stringify(sharedObject));
    const diff = (sharedBuffer.byteLength / 4) - objectByteLength;


    if (diff <= 0) {
        if (!sharedBuffer.grow) {
            throw new Error('No more space, create a new bigger shared object or use Node >= v20 to support auto grow.');
        }

        // byte length of Int32Array should be a multiple of 4
        let growedLength = sharedBuffer.byteLength + (4 * Math.abs(diff)) + 64;

        sharedBuffer.grow(growedLength);
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
            if (key === SHARED_OBJECT_BUFFER) {
                return sharedBuffer;
            }

            lock(valueBuffer);
            
            const sharedObject = loadPlainSharedObject(valueBuffer);

            unlock(valueBuffer);

            if (key === PLAIN_SHARED_OBJECT) {
                return sharedObject;
            }

            return sharedObject[key];
        },
    };
}

function createSharedObject(initialObject={}, length=DEFAULT_OBJECT_BYTE_LENGTH) {
    const stringifiedObject = JSON.stringify(initialObject);

    length += length % 4; // should be a multiple of 4

    if (stringifiedObject.length >= length) {
        length = 4 * stringifiedObject.length;
    }

    const sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * length, {
        maxByteLength: MAX_OBJECT_BYTE_LENGTH,
    });
    const valueBuffer = getSharedMemoryBuffer(sharedBuffer);

    valueBuffer[0] = UNLCOKED; // first value used for locking and unlocking

    saveObjectInBuffer(null, valueBuffer, stringifiedObject);

    const handlers = creteObjectProxyHandlers(sharedBuffer, valueBuffer);

    return new Proxy(initialObject, handlers);
}

function getSharedObject(sharedBuffer) {
    const valueBuffer = getSharedMemoryBuffer(sharedBuffer);

    lock(valueBuffer);
    const sharedObject = loadPlainSharedObject(valueBuffer);
    unlock(valueBuffer);

    const handlers = creteObjectProxyHandlers(sharedBuffer, valueBuffer);

    return new Proxy(sharedObject, handlers);
}

function getPlainObject(sharedObject) {
    if (!util.types.isProxy(sharedObject)) {
        return null;
    }
    
    return sharedObject[PLAIN_SHARED_OBJECT];
}

function getSharedObjectBuffer(sharedObject) {
    if (!util.types.isProxy(sharedObject)) {
        return null;
    }
    return sharedObject[SHARED_OBJECT_BUFFER];
}

module.exports = {
    createSharedObject,
    getSharedObject,
    getPlainObject,
    getSharedObjectBuffer,
};
