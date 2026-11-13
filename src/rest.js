import axios from 'axios';
import generateHash from './generateHash.js';
import OddsHawkApiError, { mapAxiosError } from './apiError.js';

/** The request header carrying the OddsHawk username. */
const USER_HEADER = 'X-OH-USER';
/** The request header carrying the signature in password mode and the caller's hash in browser mode, dropped once the browser-mode session is authenticated. */
const HASH_HEADER = 'X-OH-HASH';

/**
 * The REST client: the catalog reads, the matching helpers and, in browser mode, the exchange that turns a hash into a session cookie.
 */
export default class Rest {
  /**
   * @param {string} username The OddsHawk identifier every request is authenticated with.
   * @param {string} hash The password in password mode, and the hash the caller's own server computed in browser mode.
   * @param {boolean} isPassword Whether `hash` is a password to sign for each request.
   * @param {string} [baseUrl='https://www.odds.software'] The origin every request is sent to.
   */
  constructor (username, hash, isPassword, baseUrl = 'https://www.odds.software') {
    this.username = username;
    this.hash = hash;
    this.isPassword = isPassword;
    this.authenticated = isPassword;
    this.baseUrl = baseUrl;
  }

  /**
   * The axios options for a request in the client's mode and session state.
   * @returns {Object} The headers to send, the 15-second timeout and, in browser mode, the credentials flag.
   */
  options () {
    if (!this.isPassword) {
      if (this.authenticated) {
        return {
          headers: {
            [USER_HEADER]: this.username
          },
          withCredentials: true,
          timeout: 15000
        };
      } else {
        return {
          headers: {
            [USER_HEADER]: this.username,
            [HASH_HEADER]: this.hash
          },
          withCredentials: true,
          timeout: 15000
        };
      }
    } else {
      return {
        headers: {
          [USER_HEADER]: this.username,
          [HASH_HEADER]: generateHash(this.hash)
        },
        timeout: 15000
      };
    }
  }

  /**
   * A failed request rejects with the mapped error.
   * @param {string} path The path under the base URL.
   * @param {Object} options
   * @returns {Promise<*>} The response body.
   */
  _get (path, options) {
    return axios.get(this.baseUrl + path, options).then(response => {
      return response.data;
    }).catch(e => {
      throw mapAxiosError(e);
    });
  }

  /**
   * Exchanges the hash for a browser-mode session, the one request sent without a timeout, rejecting with the mapped error when the exchange fails.
   * @returns {Promise<boolean|Object>} `true`, or the exchange's body on the call that sends it.
   */
  async authenticate () {
    if (!this.isPassword && !this.authenticated) {
      return axios.get(this.baseUrl + '/authenticate', {
        headers: {
          [USER_HEADER]: this.username,
          [HASH_HEADER]: this.hash
        },
        withCredentials: true
      }).then(response => {
        this.authenticated = response.data.authenticated;
        return response.data;
      }).catch(e => {
        throw mapAxiosError(e);
      });
    } else {
      return true;
    }
  }

  /**
   * @returns {Promise<*>} The API's answer body.
   */
  async version () {
    await this.authenticate();
    return this._get('/rest', this.options());
  }

  /**
   * @param {boolean} [fromNow=true] Stringified into the query string ahead of the `filter` keys.
   * @param {Object|URLSearchParams|Array|string} [filter={}]
   * @returns {Promise<*>} The API's answer body.
   */
  async events (fromNow = true, filter = {}) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const qs = search ? `&${search}` : '';
    return this._get('/rest/odds/events?fromNow=' + fromNow + qs, this.options());
  }

  /**
   * @param {boolean} [fromNow=true] Stringified into the query string ahead of the `filter` keys.
   * @param {Object|URLSearchParams|Array|string} [filter={}]
   * @returns {Promise<*>} The API's answer body.
   */
  async competitions (fromNow = true, filter = {}) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const qs = search ? `&${search}` : '';
    return this._get('/rest/odds/competitions?fromNow=' + fromNow + qs, this.options());
  }

  /**
   * @param {boolean} [fromNow=true] Stringified into the query string as given.
   * @returns {Promise<*>} The API's answer body.
   */
  async sports (fromNow = true) {
    await this.authenticate();
    return this._get('/rest/odds/sports?fromNow=' + fromNow, this.options());
  }

  /**
   * @param {boolean} [fromNow=true] Stringified into the query string ahead of the `filter` keys.
   * @param {Object|URLSearchParams|Array|string} [filter={}]
   * @returns {Promise<*>} The API's answer body.
   */
  async markets (fromNow = true, filter = {}) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const qs = search ? `&${search}` : '';
    return this._get('/rest/odds/markets?fromNow=' + fromNow + qs, this.options());
  }

  /**
   * @param {boolean} [fromNow=true] Stringified into the query string ahead of the `filter` keys.
   * @param {Object|URLSearchParams|Array|string} [filter={}]
   * @returns {Promise<*>} The API's answer body.
   */
  async providers (fromNow = true, filter = {}) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const qs = search ? `&${search}` : '';
    return this._get('/rest/odds/providers?fromNow=' + fromNow + qs, this.options());
  }

  /**
   * @param {Object|URLSearchParams|Array|string} filter
   * @returns {Promise<*>} The API's answer body.
   */
  async odds (filter) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    return this._get('/rest/odds?' + search, this.options());
  }

  /**
   * Resolves a provider's spelling of an event to the OddsHawk event record, answering `false` for a lookup that gives no record and for a failure of its own request.
   * @param {string} provider The provider whose spelling `name` is in.
   * @param {string} name The name to resolve, encoded before it is sent: a canonical name, a provider spelling or a known alias.
   * @param {number} time The event's start in unix seconds.
   * @param {string} sport
   * @param {boolean} [init=false] Whether to register a name the API has not resolved yet.
   * @returns {Promise<Object|boolean>} The record, or `false` for no record and for a failure of its own request.
   */
  async matchEvent (provider, name, time, sport, init = false) {
    await this.authenticate();
    const options = this.options();
    return axios.get(this.baseUrl + '/rest/match/event?provider=' + provider + '&name=' + encodeURIComponent(name) + '&time=' + time + '&sport=' + sport + '&init=' + init, options).then(response => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    }).catch(() => {
      return false;
    });
  }

  /**
   * Resolves a provider's spelling of a selection to the OddsHawk selection record, answering `false` for a lookup that gives no record and for a failure of its own request.
   * @param {string} provider The provider whose spelling `name` is in.
   * @param {string} name The name to resolve, encoded before it is sent: a canonical name, a provider spelling or a known alias.
   * @param {number} time The event's start in unix seconds.
   * @param {string} sport
   * @param {string} eventName The event the selection belongs to.
   * @param {boolean} [init=false] Whether to register a name the API has not resolved yet.
   * @returns {Promise<Object|boolean>} The record, or `false` for no record and for a failure of its own request.
   */
  async matchSelection (provider, name, time, sport, eventName, init = false) {
    await this.authenticate();
    const options = this.options();
    return axios.get(this.baseUrl + '/rest/match/selection?provider=' + provider + '&name=' + encodeURIComponent(name) + '&time=' + time + '&sport=' + sport + '&event=' + eventName + '&init=' + init, options).then(response => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    }).catch(() => {
      return false;
    });
  }

  /**
   * Resolves a provider's spelling of a team to the OddsHawk team record, answering `false` for a lookup that gives no record and for a failure of its own request.
   * @param {string} provider The provider whose spelling `name` is in.
   * @param {string} name The name to resolve, encoded before it is sent: a canonical name, a provider spelling or a known alias.
   * @param {number} time The event's start in unix seconds.
   * @param {string} sport
   * @param {boolean} [init=false] Whether to register a name the API has not resolved yet.
   * @returns {Promise<Object|boolean>} The record, or `false` for no record and for a failure of its own request.
   */
  async matchTeam (provider, name, time, sport, init = false) {
    await this.authenticate();
    const options = this.options();
    return axios.get(this.baseUrl + '/rest/match/team?provider=' + provider + '&name=' + encodeURIComponent(name) + '&time=' + time + '&sport=' + sport + '&init=' + init, options).then(response => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    }).catch(() => {
      return false;
    });
  }

  /**
   * Resolves a provider's spelling of a competition to the OddsHawk competition record, answering `false` for a lookup that gives no record and for a failure of its own request.
   * @param {string} provider The provider whose spelling `name` is in.
   * @param {string} name The name to resolve, encoded before it is sent: a canonical name, a provider spelling or a known alias.
   * @param {number} time The event's start in unix seconds.
   * @param {string} sport
   * @param {boolean} [init=false] Whether to register a name the API has not resolved yet.
   * @returns {Promise<Object|boolean>} The record, or `false` for no record and for a failure of its own request.
   */
  async matchCompetition (provider, name, time, sport, init = false) {
    await this.authenticate();
    const options = this.options();
    return axios.get(this.baseUrl + '/rest/match/competition?provider=' + provider + '&name=' + encodeURIComponent(name) + '&time=' + time + '&sport=' + sport + '&init=' + init, options).then(response => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    }).catch(() => {
      return false;
    });
  }
}

export { OddsHawkApiError, USER_HEADER, HASH_HEADER };
