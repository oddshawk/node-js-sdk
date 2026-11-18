/**
 * The transport double the live-session suite drives `src/socket.js` through.
 *
 * The session opens over `global.WebSocket` when the runtime has one, and over the `ws`
 * package when it does not. Registering a resolve hook for `ws` here points that second
 * path at this double as well, so either transport can be exercised without a connection
 * leaving the process.
 */
import { registerHooks } from 'node:module';

export default class FakeTransport {
  static created = [];

  /**
   * @param {string} url The address the session was opened at, kept as given.
   */
  constructor (url) {
    this.url = url;
    this.sent = [];
    this.listeners = { open: [], close: [], error: [], message: [] };
    this.channels = {};
    FakeTransport.created.push(this);
  }

  /**
   * @returns {FakeTransport} The transport opened last, cleared by `reset()`.
   */
  static last () {
    return FakeTransport.created[FakeTransport.created.length - 1];
  }

  static reset () {
    FakeTransport.created = [];
  }

  on (type, func) {
    this.record(type, 'on', func);
  }

  addEventListener (type, func) {
    this.record(type, 'addEventListener', func);
  }

  /**
   * Keeps the handler and the interface it arrived on, so a test can tell which transport
   * surface the session registered against.
   */
  record (type, channel, func) {
    this.listeners[type].push(func);
    this.channels[type] = channel;
  }

  get onopen () {
    return this.listeners.open[0];
  }

  set onopen (func) {
    this.record('open', 'property', func);
  }

  get onclose () {
    return this.listeners.close[0];
  }

  set onclose (func) {
    this.record('close', 'property', func);
  }

  get onerror () {
    return this.listeners.error[0];
  }

  set onerror (func) {
    this.record('error', 'property', func);
  }

  /**
   * @param {string} frame The frame the client sent, which must be JSON.
   */
  send (frame) {
    this.sent.push(JSON.parse(frame));
  }

  open () {
    this.listeners.open.forEach(func => func());
  }

  /**
   * @param {Object} frame The frame the feed delivers, carried as its own JSON payload.
   */
  receive (frame) {
    this.listeners.message.forEach(func => func({ data: JSON.stringify(frame) }));
  }

  close () {
    this.listeners.close.forEach(func => func());
  }

  /**
   * @param {Error} error The failure the transport reports.
   */
  error (error) {
    this.listeners.error.forEach(func => func(error));
  }
}

registerHooks({
  resolve (specifier, context, nextResolve) {
    if (specifier === 'ws') {
      return { url: import.meta.url, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
});
