import axios from 'axios';
import generateHash from './generateHash.js';

export default class Rest {
  constructor (username, hash, isPassword) {
    this.username = username;
    this.hash = hash;
    this.isPassword = isPassword; // If is not password then we use cookie authentication after first request
    this.authenticated = isPassword;
  }

  options () {
    if (!this.isPassword) {
      if (this.authenticated) {
        return {
          headers: {
            'X-OH-User': this.username
          },
          withCredentials: true
        };
      } else {
        return {
          headers: {
            'X-OH-User': this.username,
            'X-OH-Hash': this.hash
          },
          withCredentials: true
        };
      }
    } else {
      return {
        headers: {
          'X-OH-User': this.username,
          'X-OH-Hash': generateHash(this.hash)
        }
      };
    }
  }

  async authenticate () {
    if (!this.isPassword && !this.authenticated) {
      return axios.get('https://www.odds.software/authenticate', {
        headers: {
          'X-OH-User': this.username,
          'X-OH-Hash': this.hash
        },
        withCredentials: true
      }).then(response => {
        this.authenticated = response.data.authenticated;
      });
    } else {
      return true;
    }
  }

  async events (fromNow = true) {
    await this.authenticate();
    return axios.get('https://www.odds.software/rest/odds/events?fromNow=' + fromNow, this.options()).then(response => {
      return response.data;
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
    return axios.get('https://www.odds.software/rest/odds?' + search, this.options()).then(response => {
      return response.data;
    });
  }

  async matchEvent (provider, name, time, sport) {
    await this.authenticate();
    return axios.get('https://www.odds.software/rest/match/event?provider=' + provider + '&name=' + name + '&time=' + time + '&sport=' + sport).then(response => {
      if (response.data) {
        return response.data.event;
      } else {
        return false;
      }
    });
  }

  async matchSelection (provider, name, time, sport, eventName) {
    await this.authenticate();
    return axios.get('https://www.odds.software/rest/match/selection?provider=' + provider + '&name=' + name + '&time=' + time + '&sport=' + sport + '&event=' + eventName).then(response => {
      if (response.data) {
        return response.data.event;
      } else {
        return false;
      }
    });
  }
}
