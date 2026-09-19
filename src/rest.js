import axios from 'axios';
import generateHash from './generateHash.js';
import OddsHawkApiError, { mapAxiosError } from './apiError.js';

const USER_HEADER = 'X-OH-USER';
const HASH_HEADER = 'X-OH-HASH';

export default class Rest {
  constructor (username, hash, isPassword, baseUrl = 'https://www.odds.software') {
    this.username = username;
    this.hash = hash;
    this.isPassword = isPassword; // If is not password then we use cookie authentication after first request
    this.authenticated = isPassword;
    this.baseUrl = baseUrl;
  }

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

  _get (path, options) {
    return axios.get(this.baseUrl + path, options).then(response => {
      return response.data;
    }).catch(e => {
      throw mapAxiosError(e);
    });
  }

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
   * Public API version (`GET /rest`).
   * @returns {Promise<{ version: string }>}
   */
  async version () {
    await this.authenticate();
    return this._get('/rest', this.options());
  }

  /**
   * Distinct events (`GET /rest/odds/events`).
   * Filter keys: sport, competition, provider, market.
   * @param {boolean} [fromNow=true]
   * @param {object|URLSearchParams|Array} [filter={}]
   */
  async events (fromNow = true, filter = {}) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const qs = search ? `&${search}` : '';
    return this._get('/rest/odds/events?fromNow=' + fromNow + qs, this.options());
  }

  /**
   * Distinct competitions (`GET /rest/odds/competitions`).
   * Filter keys: sport, provider.
   * @param {boolean} [fromNow=true]
   * @param {object|URLSearchParams|Array} [filter={}]
   */
  async competitions (fromNow = true, filter = {}) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const qs = search ? `&${search}` : '';
    return this._get('/rest/odds/competitions?fromNow=' + fromNow + qs, this.options());
  }

  /**
   * Distinct sports (`GET /rest/odds/sports`).
   * @param {boolean} [fromNow=true]
   */
  async sports (fromNow = true) {
    await this.authenticate();
    return this._get('/rest/odds/sports?fromNow=' + fromNow, this.options());
  }

  /**
   * Distinct market names (`GET /rest/odds/markets`).
   * Filter keys: sport, competition, provider.
   * @param {boolean} [fromNow=true]
   * @param {object|URLSearchParams|Array} [filter={}]
   */
  async markets (fromNow = true, filter = {}) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const qs = search ? `&${search}` : '';
    return this._get('/rest/odds/markets?fromNow=' + fromNow + qs, this.options());
  }

  /**
   * Distinct providers (`GET /rest/odds/providers`).
   * Filter keys: sport, competition.
   * @param {boolean} [fromNow=true]
   * @param {object|URLSearchParams|Array} [filter={}]
   */
  async providers (fromNow = true, filter = {}) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const qs = search ? `&${search}` : '';
    return this._get('/rest/odds/providers?fromNow=' + fromNow + qs, this.options());
  }

  /**
   * Search odds (`GET /rest/odds`).
   * Query keys (OpenAPI 0.3.0): fromNow, eventTime, eventName, eventId, sport,
   * provider, selectionStatus, market, updatedBefore, competition, competitionName,
   * sortField, sortDirection, limit, skip.
   * @param {object|URLSearchParams|Array} filter
   */
  async odds (filter) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    return this._get('/rest/odds?' + search, this.options());
  }

  /**
   * Matching helper — documented in the OpenAPI `Matching` section. Like the rest of `/rest`,
   * it is available to any authenticated account.
   * `GET /rest/match/event` — resolve a provider event name to a canonical event.
   * Returns false when the API has no match (or on failure).
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
   * Matching helper — documented in the OpenAPI `Matching` section. Like the rest of `/rest`,
   * it is available to any authenticated account.
   * `GET /rest/match/selection` — resolve a provider selection name to a canonical selection.
   * Returns false when the API has no match (or on failure).
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
   * Matching helper — documented in the OpenAPI `Matching` section. Like the rest of `/rest`,
   * it is available to any authenticated account.
   * `GET /rest/match/team` — resolve a provider team name to a canonical team.
   * Returns false when the API has no match (or on failure).
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
   * Matching helper — documented in the OpenAPI `Matching` section. Like the rest of `/rest`,
   * it is available to any authenticated account.
   * `GET /rest/match/competition` — resolve a provider competition name to a canonical competition.
   * Returns false when the API has no match (or on failure).
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
