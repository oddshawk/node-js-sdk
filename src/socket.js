import Websocket from 'ws';

/**
 * The client over the live odds socket: one auth frame opens the session, and a ping keeps it alive.
 */
export default class Socket {
  /**
   * @param {string} username The OddsHawk identifier the session authenticates as.
   * @param {string} hash The credential the auth frame carries, sent exactly as given.
   */
  constructor (username, hash) {
    this.username = username;
    this.hash = hash;
  }

  /**
   * Opens the session with the auth frame and the first ping, resolving `connected` once the feed confirms the session, then keeps it open: each answer to a ping schedules the next one 15 seconds later.
   */
  connect () {
    this.closed = false;
    this.connected = new Promise(resolve => {
      if (global.WebSocket) {
        this.ws = new global.WebSocket('wss://ws.odds.software');
        this.ws.onopen = () => {
          this.ws.send(JSON.stringify({
            message: 'auth',
            user: this.username,
            hash: this.hash
          }));
          this.ws.send(JSON.stringify({
            message: 'ping'
          }));
        };

        this.ws.onclose = (e) => {
          this.closeFunction();
          this.closed = true;
        };

        this.ws.onerror = (e) => {
          console.log(e);
          this.errorFunction();
          this.closed = true;
        };

        this.ws.addEventListener('message', (message) => {
          message = JSON.parse(message.data);
          switch (message.message) {
            case 'auth':
              resolve();
              break;
            case 'pong':
              setTimeout(() => {
                this.ws.send(JSON.stringify({
                  message: 'ping'
                }));
              }, 15000);
              break;
            case 'updates':
              this.updates(message.data);
              break;
            case 'initial':
              this.initial(message.data);
              break;
          }
        });
      } else {
        this.ws = new Websocket('wss://ws.odds.software');
        this.ws.on('open', () => {
          this.ws.send(JSON.stringify({
            message: 'auth',
            user: this.username,
            hash: this.hash
          }));
          this.ws.send(JSON.stringify({
            message: 'ping'
          }));
        });

        this.ws.on('close', (e) => {
          this.closeFunction();
          this.closed = true;
        });

        this.ws.on('error', (e) => {
          console.log(e);
          this.errorFunction();
          this.closed = true;
        });

        this.ws.addEventListener('message', (message) => {
          message = JSON.parse(message.data);
          switch (message.message) {
            case 'auth':
              resolve();
              break;
            case 'pong':
              setTimeout(() => {
                this.ws.send(JSON.stringify({
                  message: 'ping'
                }));
              }, 15000);
              break;
            case 'updates':
              this.updates(message.data);
              break;
            case 'initial':
              this.initial(message.data);
              break;
          }
        });
      }
    });
  }

  /**
   * Subscribes to the live feed, sending the filter as soon as the session is confirmed.
   * @param {Object} filter The filter the subscription carries, sent to the feed as given.
   * @throws {Error} When the connection has already closed.
   * @throws {TypeError} When called before `connect()`.
   */
  subscribe (filter) {
    if (this.closed) {
      throw new Error('Socket is closed');
    }
    this.connected.then(() => {
      this.ws.send(JSON.stringify({
        message: 'subscribe',
        filter
      }));
    });
  }

  /**
   * @param {Function} func Called with the update frame's data.
   */
  onUpdate (func) {
    this.updates = func;
  }

  /**
   * @param {Function} func Called with the initial frame's data.
   */
  onInitial (func) {
    this.initial = func;
  }

  /**
   * @param {Function} func Runs when the connection closes, and receives no arguments.
   */
  onClose (func) {
    this.closeFunction = func;
  }

  /**
   * @param {Function} func Runs when the transport reports an error, and receives no arguments: the client logs the error itself.
   */
  onError (func) {
    this.errorFunction = func;
  }
}
