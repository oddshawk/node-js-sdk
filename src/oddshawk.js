import generateHash from './generateHash.js';
import Rest from './rest.js';
import Socket from './socket.js';

export default class OddsHawk {
  constructor (username, hash, isPassword = false, baseUrl = 'https://www.odds.software') {
    this.rebuild(username, hash, isPassword, baseUrl);
  }

  rebuild (username, hash, isPassword = false, baseUrl = 'https://www.odds.software') {
    if (!username || typeof username !== 'string') {
      throw new TypeError('Username required');
    }
    if (!hash || typeof hash !== 'string') {
      throw new TypeError('Hash required');
    }
    this.username = username;
    if (isPassword) {
      this.password = hash;
    } else {
      this.hash = hash;
    }
    this.rest = new Rest(username, hash, isPassword, baseUrl);
    if (!this.hash) {
      this.ws = new Socket(username, generateHash(hash));
    } else {
      this.ws = new Socket(username, hash);
    }
  }
}
