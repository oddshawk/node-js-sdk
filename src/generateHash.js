import sha256 from 'js-sha256';

const generateHash = (key) => {
  const time = Math.round(Date.now() / 1000);
  const hash = sha256.create();
  const hex = time.toString(16);
  hash.update(key + time);
  return hash + hex;
};

export default generateHash;
