const decoder = new TextDecoder("utf8");
const encoder = new TextEncoder("utf8");

const { lock, unlock, UNLCOKED } = require("./mutex");

const DEFAULT_OBJECT_BYTE_LENGTH = 4096; // total characters of stringified object (2^12)
const MAX_OBJECT_BYTE_LENGTH = 4294967296; // max characters length for the stringified object (2^32)

const PLAIN_OBJECT = Symbol("PLAIN_OBJECT");
const VALUE_BUFFER = Symbol("VALUE_BUFFER");
const SHARED_BUFFER = Symbol("SHARED_BUFFER");

function getSharedMemoryBuffer(sharedBuffer) {
  return new Int32Array(sharedBuffer);
}

function calculateUsedBufferLength(valueBuffer) {
  // exclude first item
  return valueBuffer.reduce((acc, value) => acc + (value ? 1 : 0), -1);
}

function loadPlainSharedObject(valueBuffer) {
  const usedBufferLength = calculateUsedBufferLength(valueBuffer);
  const decodeBuffer = new Uint8Array(usedBufferLength);

  for (let i = 1; i <= usedBufferLength; i++) {
    if (valueBuffer[i]) {
      decodeBuffer[i - 1] = valueBuffer[i];
    }
  }

  return JSON.parse(decoder.decode(decodeBuffer));
}

function safeLoadSharedObject(valueBuffer) {
  lock(valueBuffer);

  const sharedObject = loadPlainSharedObject(valueBuffer);

  unlock(valueBuffer);

  return sharedObject;
}

function calculateStringByteLength(string) {
  return encoder.encode(string).length;
}

function saveObjectInBuffer(sharedObject, valueBuffer, objString) {
  objString ??= JSON.stringify(sharedObject);

  const stringByteLength = calculateStringByteLength(objString);
  const encodeBuffer = new Uint8Array(stringByteLength);
  encoder.encodeInto(objString, encodeBuffer);

  for (let i = 0; i < stringByteLength; i++) {
    valueBuffer[i + 1] = encodeBuffer[i];
  }

  for (let j = stringByteLength + 1; j < valueBuffer.length; j++) {
    valueBuffer[j] = 0;
  }
}

function adjustSharedBufferGrow(sharedBuffer, sharedObject) {
  const objectByteLength = calculateStringByteLength(
    JSON.stringify(sharedObject),
  );
  const diff = sharedBuffer.byteLength / 4 - objectByteLength;

  if (diff <= 0) {
    if (!sharedBuffer.grow) {
      throw new Error(
        "No more space, create a new bigger shared object or use Node >= v20 to support auto grow.",
      );
    }

    // byte length of Int32Array should be a multiple of 4
    const growedLength = sharedBuffer.byteLength + 4 * Math.abs(diff) + 64;

    sharedBuffer.grow(growedLength);
  }
}

function WorkerMap(providedObject, length = DEFAULT_OBJECT_BYTE_LENGTH) {
  if (providedObject instanceof SharedArrayBuffer) {
    const sharedBuffer = providedObject;

    const valueBuffer = getSharedMemoryBuffer(sharedBuffer);

    this[SHARED_BUFFER] = sharedBuffer;
    this[VALUE_BUFFER] = valueBuffer;

    return this;
  }

  const initialObject = providedObject || {};
  const stringifiedObject = JSON.stringify(initialObject);

  length += length % 4; // should be a multiple of 4

  if (stringifiedObject.length >= length) {
    length = 4 * stringifiedObject.length;
  }

  const sharedBuffer = new SharedArrayBuffer(
    Int32Array.BYTES_PER_ELEMENT * length,
    {
      maxByteLength: MAX_OBJECT_BYTE_LENGTH,
    },
  );
  const valueBuffer = getSharedMemoryBuffer(sharedBuffer);

  valueBuffer[0] = UNLCOKED; // first value used for locking and unlocking

  saveObjectInBuffer(null, valueBuffer, stringifiedObject);

  this[SHARED_BUFFER] = sharedBuffer;
  this[VALUE_BUFFER] = valueBuffer;

  return this;
}

WorkerMap.prototype.set = function (key, value) {
  if (typeof key === "function" || typeof value === "function") {
    return false;
  }

  const valueBuffer = this[VALUE_BUFFER];
  const sharedBuffer = this[SHARED_BUFFER];

  if (Number.isNaN(value) || value === undefined) {
    value = null;
  }

  lock(valueBuffer);

  const sharedObject = loadPlainSharedObject(valueBuffer);

  sharedObject[key] = value;

  adjustSharedBufferGrow(sharedBuffer, sharedObject);

  saveObjectInBuffer(sharedObject, valueBuffer);

  unlock(valueBuffer);

  return true;
};

WorkerMap.prototype.get = function (key) {
  const valueBuffer = this[VALUE_BUFFER];
  const sharedObject = safeLoadSharedObject(valueBuffer);

  if (key === PLAIN_OBJECT) {
    return sharedObject;
  }

  return sharedObject[key];
};

WorkerMap.prototype.delete = function (key) {
  const valueBuffer = this[VALUE_BUFFER];

  lock(valueBuffer);

  const sharedObject = loadPlainSharedObject(valueBuffer);

  if (sharedObject[key] === undefined) {
    unlock(valueBuffer);

    return false;
  }

  delete sharedObject[key];

  saveObjectInBuffer(sharedObject, valueBuffer);

  unlock(valueBuffer);

  return true;
};

WorkerMap.prototype.size = function () {
  const valueBuffer = this[VALUE_BUFFER];
  const sharedObject = safeLoadSharedObject(valueBuffer);

  return Object.keys(sharedObject).length;
};

WorkerMap.prototype.keys = function () {
  const valueBuffer = this[VALUE_BUFFER];
  const sharedObject = safeLoadSharedObject(valueBuffer);

  return Object.keys(sharedObject);
};

WorkerMap.prototype.has = function (key) {
  const valueBuffer = this[VALUE_BUFFER];
  const sharedObject = safeLoadSharedObject(valueBuffer);

  return sharedObject[key] !== undefined;
};

WorkerMap.prototype.toSharedBuffer = function () {
  return this[SHARED_BUFFER];
};

WorkerMap.prototype.toObject = function () {
  return this.get(PLAIN_OBJECT);
};

module.exports = { WorkerMap };
