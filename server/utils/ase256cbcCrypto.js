const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const fnv = require('fnv-plus');
const config = require('../config');

const ENCRYPTION_KEY = Buffer.from(config.encryption.aes256Cbc.key, "hex");
const IV_PREFIX = config.encryption.aes256Cbc.ivPrefix;

const getIV = uuid => {
  const ahash64 = fnv.hash(IV_PREFIX + uuid, 64);
  const buf = Buffer.from(ahash64.hex(), 'hex');
  const IV = Buffer.concat([buf, buf], 16);
  return {
    IV,
    uuid
  };
}

const encrypt = text => {
  const uuid = uuidv4();
  const IV_uuid = getIV(uuid);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV_uuid.IV);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    "session": IV_uuid.uuid,
    "content": encrypted.toString('hex')
  }
}

const decrypt = (uuid, text) => {
  const IV_uuid = getIV(uuid);
  const encryptedText = Buffer.from(text, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV_uuid.IV);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

exports.encrypt = encrypt;
exports.decrypt = decrypt;