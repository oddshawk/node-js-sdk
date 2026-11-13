import sha256 from 'js-sha256';

/**
 * Signs a credential for password mode, naming the moment of the call to the nearest whole second.
 * @param {string} key The credential as the caller holds it.
 * @returns {string} The signature: the digest of the credential and the named second, followed by that second in hex.
 */
const generateHash = (key) => {
  const time = Math.round(Date.now() / 1000);
  const hash = sha256.create();
  const hex = time.toString(16);
  hash.update(key + time);
  return hash + hex;
};

export default generateHash;
