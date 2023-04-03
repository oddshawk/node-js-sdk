import Websocket from 'ws';

export default class Socket {
  constructor (username, hash) {
    this.username = username;
    this.hash = hash;
  }

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
            // fallthrough
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
              // fallthrough
            case 'initial':
              this.initial(message.data);
              break;
          }
        });
      }
    });
  }

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

  onUpdate (func) {
    this.updates = func;
  }

  onInitial (func) {
    this.initial = func;
  }

  onClose (func) {
    this.closeFunction = func;
  }

  onError (func) {
    this.errorFunction = func;
  }
}
