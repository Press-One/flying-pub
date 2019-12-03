const aesjs = require('aes-js');

exports.aesDecrypt = (encryptedHex, privateKey, counterInitialValue = 5) => {
  const encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
  const aesCtr = new aesjs.ModeOfOperation.ctr(privateKey, new aesjs.Counter(counterInitialValue));
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);
  const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedText;
};

exports.aesCrypto = (text, privateKey, counterInitialValue = 5) => {
  const textBytes = aesjs.utils.utf8.toBytes(text);
  const aesCtr = new aesjs.ModeOfOperation.ctr(privateKey, new aesjs.Counter(counterInitialValue));
  const encryptedBytes = aesCtr.encrypt(textBytes);
  const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  return encryptedHex;
};