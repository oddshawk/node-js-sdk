import generateHash from './generateHash.js';
import Rest from './rest.js';
import Socket from './socket.js';

/**
 * The client object a caller constructs and works through, holding the REST client and the live socket.
 * Each construction and each `rebuild()` builds both clients again, with a fresh signature on a client that holds no browser-mode hash.
 */
export default class OddsHawk {
  /**
   * @param {string} username The OddsHawk identifier every request is authenticated with.
   * @param {string} hash The password in password mode, and a hash the caller's own server computed otherwise.
   * @param {boolean} [isPassword=false] Whether `hash` is the password to sign for each request.
   * @param {string} [baseUrl='https://www.odds.software'] The origin REST requests are sent to.
   * @throws {TypeError} When `username` or `hash` is missing or not a string.
   */
  constructor (username, hash, isPassword = false, baseUrl = 'https://www.odds.software') {
    this.rebuild(username, hash, isPassword, baseUrl);
  }

  /**
   * The object a caller already holds is the one changed, so a caller keeps it across a credential change.
   * @param {string} username The OddsHawk identifier every request is authenticated with.
   * @param {string} hash The password in password mode, and a hash the caller's own server computed otherwise.
   * @param {boolean} [isPassword=false] Whether `hash` is the password to sign for each request.
   * @param {string} [baseUrl='https://www.odds.software'] The origin REST requests are sent to.
   * @throws {TypeError} When `username` or `hash` is missing or not a string.
   */
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
