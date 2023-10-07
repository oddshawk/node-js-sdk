import axios from 'axios';
import generateHash from './generateHash.js';

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
            'X-OH-User': this.username
          },
          withCredentials: true,
          timeout: 15000
        };
      } else {
        return {
          headers: {
            'X-OH-User': this.username,
            'X-OH-Hash': this.hash
          },
          withCredentials: true,
          timeout: 15000
        };
      }
    } else {
      return {
        headers: {
          'X-OH-User': this.username,
          'X-OH-Hash': generateHash(this.hash)
        },
        timeout: 15000
      };
    }
  }

  async authenticate () {
    if (!this.isPassword && !this.authenticated) {
      return axios.get(this.baseUrl + '/authenticate', {
        headers: {
          'X-OH-User': this.username,
          'X-OH-Hash': this.hash
        },
        withCredentials: true
      }).then(response => {
        this.authenticated = response.data.authenticated;
      }).catch(e => {
        throw new Error('API request failed with message: ' + e.message);
      });
    } else {
      return true;
    }
  }

  async events (fromNow = true, filter = []) {
    await this.authenticate();
    const options = this.options();
    const search = new URLSearchParams(filter).toString();
    return axios.get(this.baseUrl + '/rest/odds/events?fromNow=' + fromNow + '&' + search, options).then(response => {
      return response.data;
    }).catch(e => {
      throw new Error('API request failed with message: ' + e.message);
    });
  }

  async competitions (fromNow = true, filter = []) {
    await this.authenticate();
    const options = this.options();
    const search = new URLSearchParams(filter).toString();
    return axios.get(this.baseUrl + '/rest/odds/competitions?fromNow=' + fromNow + '&' + search, options).then(response => {
      return response.data;
    }).catch(e => {
      throw new Error('API request failed with message: ' + e.message);
    });
  }

  async sports (fromNow = true) {
    await this.authenticate();
    const options = this.options();
    return axios.get(this.baseUrl + '/rest/odds/sports?fromNow=' + fromNow, options).then(response => {
      return response.data;
    }).catch(e => {
      throw new Error('API request failed with message: ' + e.message);
    });
  }

  /**
   * Filter options
   * fromNow boolean
   * eventTime int
   * eventName string
   * selectionStatus "ACTIVE"|"REMOVED"|"HIDDEN"
   * sport string
   * provider string
   * sortField string
   * sortDirection int
   * limit int
   * skip int
   *
   * @param filter
   * @returns {Promise<AxiosResponse<any>>}
   */
  async odds (filter) {
    await this.authenticate();
    const search = new URLSearchParams(filter).toString();
    const options = this.options();
    return axios.get(this.baseUrl + '/rest/odds?' + search, options).then(response => {
      return response.data;
    }).catch(e => {
      throw new Error('API request failed with message: ' + e.message);
    });
  }

  async matchEvent (provider, name, time, sport, init = false) {
    await this.authenticate();
    const options = this.options();
    return axios.get(this.baseUrl + '/rest/match/event?provider=' + provider + '&name=' + name + '&time=' + time + '&sport=' + sport + '&init=' + init, options).then(response => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    }).catch(e => {
      return false;
    });
  }

  async matchSelection (provider, name, time, sport, eventName, init = false) {
    await this.authenticate();
    const options = this.options();
    return axios.get(this.baseUrl + '/rest/match/selection?provider=' + provider + '&name=' + name + '&time=' + time + '&sport=' + sport + '&event=' + eventName + '&init=' + init, options).then(response => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    }).catch(e => {
      return false;
    });
  }
}
