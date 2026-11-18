import { createHash } from 'node:crypto';
import * as chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import axios from 'axios';
import * as sdk from '../index.js';
import OddsHawk from '../src/oddshawk.js';
import Rest, { USER_HEADER, HASH_HEADER } from '../src/rest.js';
import Socket from '../src/socket.js';
import generateHash from '../src/generateHash.js';
import OddsHawkApiError, { mapAxiosError } from '../src/apiError.js';
import FakeTransport from './support/fake-transport.mjs';

chai.use(sinonChai);
const { expect } = chai;
chai.should();

describe('Oddshawk', () => {
  describe('package root', () => {
    it('should export the client, the signing function and the API error class, and nothing else', () => {
      Object.keys(sdk).sort().should.deep.equal([
        'OddsHawk',
        'OddsHawkApiError',
        'generateHash'
      ]);
    });

    it('should build the client a caller works through from the exported class', () => {
      const oddshawk = new sdk.OddsHawk('alice@example.com', 'secret');
      oddshawk.username.should.equal('alice@example.com');
      oddshawk.rest.baseUrl.should.equal('https://www.odds.software');
      oddshawk.ws.username.should.equal('alice@example.com');
      expect(() => new sdk.OddsHawk('alice@example.com')).to.throw(TypeError, /Hash/);
    });

    it('should sign a password with the exported generateHash, and the client send that signature', () => {
      const clock = sinon.useFakeTimers(1_700_000_000_000);
      try {
        const signed = sdk.generateHash('secret');
        signed.should.match(/^[0-9a-f]{64}[0-9a-f]{8}$/);
        signed.slice(-8).should.equal((1_700_000_000).toString(16));
        const oddshawk = new sdk.OddsHawk('alice', 'secret', true);
        oddshawk.rest.options().headers[HASH_HEADER].should.equal(signed);
      } finally {
        clock.restore();
      }
    });

    it('should reject a failed call with the exported API error class, carrying the response', async () => {
      const getStub = sinon.stub(axios, 'get');
      try {
        const axiosErr = new Error('Request failed with status code 403');
        axiosErr.response = { status: 403, data: { message: 'Forbidden' } };
        getStub.rejects(axiosErr);
        const oddshawk = new sdk.OddsHawk('alice', 'secret');
        let thrown;
        try {
          await oddshawk.rest.version();
        } catch (e) {
          thrown = e;
        }
        thrown.should.be.an.instanceof(sdk.OddsHawkApiError);
        thrown.should.be.an.instanceof(Error);
        thrown.name.should.equal('OddsHawkApiError');
        thrown.status.should.equal(403);
        thrown.data.should.deep.equal({ message: 'Forbidden' });
        thrown.message.should.equal('OddsHawk API 403 Forbidden (not authenticated or not permitted): Forbidden');
      } finally {
        getStub.restore();
      }
    });
  });

  describe('constructor', () => {
    it('should create rest and websocket objects', () => {
      const oddshawk = new OddsHawk('a', 'b');
      oddshawk.rest.should.be.an.instanceof(Rest);
      oddshawk.ws.should.be.an.instanceof(Socket);
    });

    it('should reject missing username', () => {
      expect(() => new OddsHawk('', 'secret')).to.throw(TypeError, /Username/);
      expect(() => new OddsHawk(null, 'secret')).to.throw(TypeError, /Username/);
    });

    it('should reject missing hash/password', () => {
      expect(() => new OddsHawk('user', '')).to.throw(TypeError, /Hash/);
      expect(() => new OddsHawk('user', null)).to.throw(TypeError, /Hash/);
    });

    it('should accept custom baseUrl', () => {
      const oddshawk = new OddsHawk('user', 'secret', true, 'https://example.test');
      oddshawk.rest.baseUrl.should.equal('https://example.test');
    });
  });

  describe('rebuild', () => {
    it('should change the client a caller already holds, replacing both of its clients', () => {
      const oddshawk = new OddsHawk('alice', 'first-hash', false, 'https://first.test');
      const firstRest = oddshawk.rest;
      const firstSocket = oddshawk.ws;
      const returned = oddshawk.rebuild('bob', 'second-hash', false, 'https://second.test');
      expect(returned).to.equal(undefined);
      oddshawk.username.should.equal('bob');
      oddshawk.hash.should.equal('second-hash');
      oddshawk.rest.should.not.equal(firstRest);
      oddshawk.rest.baseUrl.should.equal('https://second.test');
      oddshawk.ws.should.not.equal(firstSocket);
      oddshawk.ws.username.should.equal('bob');
      oddshawk.ws.hash.should.equal('second-hash');
    });

    it('should hold the password and open the socket with a fresh signature of it in password mode', () => {
      const clock = sinon.useFakeTimers(1_700_000_000_000);
      try {
        const second = 1_700_000_000;
        const signed = createHash('sha256').update(`password${second}`).digest('hex') + second.toString(16);
        const oddshawk = new OddsHawk('alice', 'password', true);
        oddshawk.password.should.equal('password');
        expect(oddshawk.hash).to.equal(undefined);
        oddshawk.ws.hash.should.equal(signed);
        oddshawk.ws.hash.should.equal(generateHash('password'));
      } finally {
        clock.restore();
      }
    });

    it('should hold the hash the caller handed in and open the socket with it unsigned in browser mode', () => {
      const clock = sinon.useFakeTimers(1_700_000_000_000);
      try {
        const oddshawk = new OddsHawk('bob', 'caller-hash', false);
        oddshawk.hash.should.equal('caller-hash');
        expect(oddshawk.password).to.equal(undefined);
        oddshawk.ws.hash.should.equal('caller-hash');
        oddshawk.ws.hash.should.not.equal(generateHash('caller-hash'));
      } finally {
        clock.restore();
      }
    });

    it('should reject a rebuild that names no username or no hash, leaving the client untouched', () => {
      const oddshawk = new OddsHawk('alice', 'secret', true);
      const rest = oddshawk.rest;
      const socket = oddshawk.ws;
      const untouched = () => {
        oddshawk.username.should.equal('alice');
        oddshawk.password.should.equal('secret');
        oddshawk.rest.should.equal(rest);
        oddshawk.ws.should.equal(socket);
      };
      expect(() => oddshawk.rebuild('', 'other')).to.throw(TypeError, /Username/);
      untouched();
      expect(() => oddshawk.rebuild(42, 'other')).to.throw(TypeError, /Username/);
      untouched();
      expect(() => oddshawk.rebuild('alice', '')).to.throw(TypeError, /Hash/);
      untouched();
      expect(() => oddshawk.rebuild('alice', 42)).to.throw(TypeError, /Hash/);
      untouched();
    });

    it('should fall back to browser mode and the default origin when a rebuild names neither', () => {
      const oddshawk = new OddsHawk('alice', 'secret', true, 'https://first.test');
      oddshawk.rebuild('bob', 'caller-hash');
      oddshawk.rest.baseUrl.should.equal('https://www.odds.software');
      expect(oddshawk.rest.options().withCredentials).to.equal(true);
      oddshawk.ws.hash.should.equal('caller-hash');
    });
  });

  describe('generateHash', () => {
    it('should sign the credential and the named second, followed by that second in hex', () => {
      const clock = sinon.useFakeTimers(1_700_000_000_000);
      try {
        const second = 1_700_000_000;
        const digest = createHash('sha256').update(`password${second}`).digest('hex');
        generateHash('password').should.equal(`${digest}${second.toString(16)}`);
      } finally {
        clock.restore();
      }
    });

    it('should sign a different credential, and a different second, differently', () => {
      const clock = sinon.useFakeTimers(1_700_000_000_000);
      try {
        const signed = generateHash('password');
        generateHash('password ').should.not.equal(signed);
        clock.tick(1000);
        const later = generateHash('password');
        later.should.not.equal(signed);
        later.slice(0, 64).should.not.equal(signed.slice(0, 64));
        later.slice(-8).should.equal((1_700_000_001).toString(16));
      } finally {
        clock.restore();
      }
    });

    it('should name the moment of the call to the nearest whole second', () => {
      const clock = sinon.useFakeTimers(1_700_000_000_499);
      try {
        generateHash('password').slice(-8).should.equal((1_700_000_000).toString(16));
        clock.tick(1);
        generateHash('password').slice(-8).should.equal((1_700_000_001).toString(16));
      } finally {
        clock.restore();
      }
    });

    it('should carry the second in hex with no padding', () => {
      const clock = sinon.useFakeTimers(100_000_000_000);
      try {
        const signed = generateHash('password');
        signed.slice(-7).should.equal('5f5e100');
        signed.length.should.equal(64 + 7);
      } finally {
        clock.restore();
      }
    });
  });

  describe('Rest.options headers', () => {
    it('should send X-OH-USER and time-based X-OH-HASH in password mode', () => {
      const clock = sinon.useFakeTimers(1_700_000_000_000);
      try {
        const rest = new Rest('alice@example.com', 'pw', true);
        const opts = rest.options();
        opts.headers[USER_HEADER].should.equal('alice@example.com');
        opts.headers[HASH_HEADER].should.equal(generateHash('pw'));
        expect(opts.withCredentials).to.equal(undefined);
      } finally {
        clock.restore();
      }
    });

    it('should send hash headers before cookie auth in browser mode', () => {
      const rest = new Rest('bob', 'precomputed', false);
      const opts = rest.options();
      opts.headers[USER_HEADER].should.equal('bob');
      opts.headers[HASH_HEADER].should.equal('precomputed');
      opts.withCredentials.should.equal(true);
    });

    it('should omit hash after browser authenticate flag is set', () => {
      const rest = new Rest('bob', 'precomputed', false);
      rest.authenticated = true;
      const opts = rest.options();
      opts.headers[USER_HEADER].should.equal('bob');
      expect(opts.headers[HASH_HEADER]).to.equal(undefined);
      opts.withCredentials.should.equal(true);
    });
  });

  describe('OddsHawkApiError', () => {
    it('should name itself and carry every detail it was handed', () => {
      const cause = new Error('Request failed with status code 429');
      const apiError = new OddsHawkApiError('too many requests', {
        status: 429,
        data: { message: 'slow down' },
        code: 'rate_limited',
        cause
      });
      apiError.should.be.an.instanceof(Error);
      apiError.name.should.equal('OddsHawkApiError');
      apiError.message.should.equal('too many requests');
      apiError.status.should.equal(429);
      apiError.data.should.deep.equal({ message: 'slow down' });
      apiError.code.should.equal('rate_limited');
      apiError.cause.should.equal(cause);
    });

    it('should default the details to null and carry no cause member when none was supplied', () => {
      const apiError = new OddsHawkApiError('mapped without details');
      expect(apiError.status).to.equal(null);
      expect(apiError.data).to.equal(null);
      expect(apiError.code).to.equal(null);
      Object.prototype.hasOwnProperty.call(apiError, 'cause').should.equal(false);
    });
  });

  describe('mapAxiosError', () => {
    it('should map HTTP 403 with status and body', () => {
      const err = {
        response: { status: 403, data: { message: 'nope' } },
        message: 'Request failed with status code 403'
      };
      const mapped = mapAxiosError(err);
      mapped.should.be.an.instanceof(OddsHawkApiError);
      mapped.status.should.equal(403);
      mapped.data.should.deep.equal({ message: 'nope' });
      mapped.message.should.match(/403/);
      mapped.message.should.match(/nope/);
    });

    it('should capture optional server code without requiring usage headers', () => {
      const err = {
        response: { status: 403, data: { code: 'catalog_dropped', message: 'dropped' } },
        message: 'fail'
      };
      const mapped = mapAxiosError(err);
      mapped.code.should.equal('catalog_dropped');
      mapped.status.should.equal(403);
    });

    it('should map transport failures without response', () => {
      const err = { request: {}, message: 'timeout of 15000ms exceeded' };
      const mapped = mapAxiosError(err);
      mapped.should.be.an.instanceof(OddsHawkApiError);
      expect(mapped.status).to.equal(null);
      mapped.message.should.match(/no response/);
    });

    it('should map a failure that never left the process, carrying the transport message', () => {
      const err = new Error('Invalid URL');
      const mapped = mapAxiosError(err);
      mapped.should.be.an.instanceof(OddsHawkApiError);
      mapped.message.should.equal('OddsHawk API request failed: Invalid URL');
      expect(mapped.status).to.equal(null);
      expect(mapped.data).to.equal(null);
      expect(mapped.code).to.equal(null);
      mapped.cause.should.equal(err);
    });

    it('should label a hinted status with its hint and an unhinted status with HTTP', () => {
      const messageFor = (status, data) => mapAxiosError({ response: { status, data } }).message;
      messageFor(429, { error: 'throttled' })
        .should.equal('OddsHawk API 429 Too Many Requests: throttled');
      messageFor(403, {}).should.equal('OddsHawk API 403 Forbidden (not authenticated or not permitted)');
      messageFor(404, 'no match').should.equal('OddsHawk API HTTP 404: no match');
      messageFor(401, { message: 'unauthorized' })
        .should.equal('OddsHawk API HTTP 401: unauthorized');
    });
  });

  describe('Rest catalog calls', () => {
    let getStub;

    beforeEach(() => {
      getStub = sinon.stub(axios, 'get');
    });

    afterEach(() => {
      getStub.restore();
    });

    it('version should GET /rest', async () => {
      getStub.resolves({ data: { version: '0.3.0' } });
      const rest = new Rest('u', 'p', true);
      const data = await rest.version();
      data.should.deep.equal({ version: '0.3.0' });
      expect(getStub.calledOnce).to.equal(true);
      const url = getStub.firstCall.args[0];
      url.should.equal('https://www.odds.software/rest');
      getStub.firstCall.args[1].headers[USER_HEADER].should.equal('u');
    });

    it('odds should build query string from filter object', async () => {
      getStub.resolves({ data: [] });
      const rest = new Rest('u', 'p', true);
      await rest.odds({ sport: 'Horse Racing', limit: 10 });
      const url = getStub.firstCall.args[0];
      url.should.include('/rest/odds?');
      url.should.include('sport=Horse+Racing');
      url.should.include('limit=10');
    });

    it('events should include fromNow and filter', async () => {
      getStub.resolves({ data: [] });
      const rest = new Rest('u', 'p', true);
      await rest.events(false, { sport: 'Football' });
      const url = getStub.firstCall.args[0];
      url.should.include('/rest/odds/events?fromNow=false');
      url.should.include('sport=Football');
    });

    it('sports / markets / providers / competitions hit public catalog paths', async () => {
      getStub.resolves({ data: [] });
      const rest = new Rest('u', 'p', true);
      await rest.sports(true);
      await rest.markets(true, { sport: 'Football' });
      await rest.providers(true, { sport: 'Football' });
      await rest.competitions(true, { sport: 'Football' });
      const urls = getStub.getCalls().map(c => c.args[0]);
      urls[0].should.include('/rest/odds/sports?fromNow=true');
      urls[1].should.include('/rest/odds/markets?fromNow=true');
      urls[1].should.include('sport=Football');
      urls[2].should.include('/rest/odds/providers?fromNow=true');
      urls[3].should.include('/rest/odds/competitions?fromNow=true');
    });

    it('should send no filter query string when the filter names nothing', async () => {
      getStub.resolves({ data: [] });
      const rest = new Rest('u', 'p', true);
      await rest.events();
      await rest.competitions();
      await rest.markets();
      await rest.providers();
      getStub.getCalls().map(c => c.args[0]).should.deep.equal([
        'https://www.odds.software/rest/odds/events?fromNow=true',
        'https://www.odds.software/rest/odds/competitions?fromNow=true',
        'https://www.odds.software/rest/odds/markets?fromNow=true',
        'https://www.odds.software/rest/odds/providers?fromNow=true'
      ]);
    });

    it('should throw OddsHawkApiError on HTTP failure', async () => {
      const axiosErr = new Error('Request failed with status code 403');
      axiosErr.response = { status: 403, data: 'Forbidden' };
      getStub.rejects(axiosErr);
      const rest = new Rest('u', 'p', true);
      try {
        await rest.odds({ sport: 'Football' });
        throw new Error('expected throw');
      } catch (e) {
        e.should.be.an.instanceof(OddsHawkApiError);
        e.status.should.equal(403);
      }
    });

    it('authenticate (browser) should set authenticated from body', async () => {
      getStub.resolves({ data: { authenticated: true, admin: false } });
      const rest = new Rest('u', 'hash', false);
      const result = await rest.authenticate();
      result.should.deep.equal({ authenticated: true, admin: false });
      rest.authenticated.should.equal(true);
      getStub.firstCall.args[0].should.equal('https://www.odds.software/authenticate');
      getStub.firstCall.args[1].headers[HASH_HEADER].should.equal('hash');
    });
  });

  describe('Rest match calls', () => {
    let getStub;

    beforeEach(() => {
      getStub = sinon.stub(axios, 'get');
    });

    afterEach(() => {
      getStub.restore();
    });

    it('matchEvent should GET /rest/match/event with name, time, sport and init', async () => {
      getStub.resolves({ data: { _id: 'e1', string: 'ABC' } });
      const rest = new Rest('u', 'p', true);
      const data = await rest.matchEvent('Bet365', 'DCBA', 12345, 'Horse Racing');
      const url = getStub.firstCall.args[0];
      url.should.include('/rest/match/event?provider=Bet365&name=DCBA&time=12345&sport=Horse Racing&init=false');
      data.string.should.equal('ABC');
      getStub.firstCall.args[1].headers[USER_HEADER].should.equal('u');
    });

    it('matchSelection should include event and init', async () => {
      getStub.resolves({ data: { _id: 's1' } });
      const rest = new Rest('u', 'p', true);
      await rest.matchSelection('Bet365', 'beta', 12345, 'Horse Racing', 'ABC', true);
      const url = getStub.firstCall.args[0];
      url.should.include('/rest/match/selection?provider=Bet365&name=beta&time=12345&sport=Horse Racing&event=ABC&init=true');
    });

    it('matchTeam and matchCompetition hit their match paths', async () => {
      getStub.resolves({ data: { _id: 't1' } });
      const rest = new Rest('u', 'p', true);
      await rest.matchTeam('Bet365', 'Arsenal', 12345, 'Football');
      await rest.matchCompetition('Bet365', 'Premier League', 12345, 'Football');
      const urls = getStub.getCalls().map(c => c.args[0]);
      urls[0].should.include('/rest/match/team?provider=Bet365&name=Arsenal&time=12345&sport=Football');
      urls[1].should.include('/rest/match/competition?provider=Bet365&name=Premier%20League&time=12345&sport=Football');
    });

    it('match helpers return false when the API has no match', async () => {
      const axiosErr = new Error('Request failed with status code 404');
      axiosErr.response = { status: 404, data: { error: 'Not found' } };
      getStub.rejects(axiosErr);
      const rest = new Rest('u', 'p', true);
      const event = await rest.matchEvent('Bet365', 'nope', 1, 'Football');
      const selection = await rest.matchSelection('Bet365', 'nope', 1, 'Football', 'x');
      event.should.equal(false);
      selection.should.equal(false);
    });

    it('every match helper answers false when the API answers with no record', async () => {
      getStub.resolves({ data: null });
      const rest = new Rest('u', 'p', true);
      (await rest.matchEvent('Bet365', 'nope', 1, 'Football')).should.equal(false);
      (await rest.matchSelection('Bet365', 'nope', 1, 'Football', 'x')).should.equal(false);
      (await rest.matchTeam('Bet365', 'nope', 1, 'Football')).should.equal(false);
      (await rest.matchCompetition('Bet365', 'nope', 1, 'Football')).should.equal(false);
      getStub.callCount.should.equal(4);
    });

    it('matchTeam and matchCompetition answer false when their own request fails', async () => {
      const axiosErr = new Error('Request failed with status code 500');
      axiosErr.response = { status: 500, data: { error: 'boom' } };
      getStub.rejects(axiosErr);
      const rest = new Rest('u', 'p', true);
      (await rest.matchTeam('Bet365', 'Arsenal', 1, 'Football')).should.equal(false);
      (await rest.matchCompetition('Bet365', 'Premier League', 1, 'Football')).should.equal(false);
    });
  });
});

describe('Socket', () => {
  const transports = [
    {
      name: 'the runtime WebSocket',
      install: () => {
        global.WebSocket = FakeTransport;
      },
      channels: { open: 'property', close: 'property', error: 'property', message: 'addEventListener' }
    },
    {
      name: 'the ws package',
      install: () => {
        delete global.WebSocket;
      },
      channels: { open: 'on', close: 'on', error: 'on', message: 'addEventListener' }
    }
  ];

  transports.forEach(({ name, install, channels }) => {
    describe(`over ${name}`, () => {
      const runtimeWebSocket = global.WebSocket;
      let socket;

      beforeEach(() => {
        FakeTransport.reset();
        install();
        socket = new Socket('alice@example.com', 'hash-1');
      });

      afterEach(() => {
        global.WebSocket = runtimeWebSocket;
      });

      it('should open the feed at the odds socket with the auth frame and the first ping', () => {
        socket.connect();
        const ws = FakeTransport.last();
        ws.url.should.equal('wss://ws.odds.software');
        socket.closed.should.equal(false);
        ws.open();
        ws.sent.should.deep.equal([
          { message: 'auth', user: 'alice@example.com', hash: 'hash-1' },
          { message: 'ping' }
        ]);
      });

      it('should register its handlers on the interface this transport offers', () => {
        socket.connect();
        FakeTransport.last().channels.should.deep.equal(channels);
      });

      it('should resolve connected only once the feed confirms the session', async () => {
        socket.connect();
        const ws = FakeTransport.last();
        let confirmed = false;
        const session = socket.connected.then(() => {
          confirmed = true;
        });
        await Promise.resolve();
        confirmed.should.equal(false);
        ws.receive({ message: 'auth' });
        await session;
        confirmed.should.equal(true);
      });

      it('should send the subscription as given, once the session is confirmed', async () => {
        socket.connect();
        const ws = FakeTransport.last();
        socket.subscribe({ sport: 'Football', limit: 10 });
        await Promise.resolve();
        ws.sent.should.deep.equal([]);
        ws.receive({ message: 'auth' });
        await socket.connected;
        ws.sent.should.deep.equal([
          { message: 'subscribe', filter: { sport: 'Football', limit: 10 } }
        ]);
      });

      it('should keep the session alive by pinging on every pong', () => {
        const clock = sinon.useFakeTimers();
        try {
          socket.connect();
          const ws = FakeTransport.last();
          ws.open();
          ws.receive({ message: 'pong' });
          ws.sent.length.should.equal(2);
          clock.tick(14_999);
          ws.sent.length.should.equal(2);
          clock.tick(1);
          ws.sent.length.should.equal(3);
          ws.sent[2].should.deep.equal({ message: 'ping' });
        } finally {
          clock.restore();
        }
      });

      it('should deliver the update and initial frames to the handlers it was given', () => {
        const updates = [];
        const initial = [];
        socket.onUpdate(data => updates.push(data));
        socket.onInitial(data => initial.push(data));
        socket.connect();
        const ws = FakeTransport.last();
        ws.receive({ message: 'updates', data: [{ event: 'e1', prices: [2.5] }] });
        ws.receive({ message: 'initial', data: { sports: ['Football'] } });
        updates.should.deep.equal([[{ event: 'e1', prices: [2.5] }]]);
        initial.should.deep.equal([{ sports: ['Football'] }]);
      });

      it('should run the close handler with no arguments, then refuse a subscription', () => {
        const onClose = sinon.spy();
        socket.onClose(onClose);
        socket.connect();
        FakeTransport.last().close();
        onClose.callCount.should.equal(1);
        onClose.firstCall.args.should.deep.equal([]);
        socket.closed.should.equal(true);
        expect(() => socket.subscribe({ sport: 'Football' })).to.throw(Error, 'Socket is closed');
      });

      it('should log the transport error itself, then run the error handler and close', () => {
        const onError = sinon.spy();
        socket.onError(onError);
        const log = sinon.stub(console, 'log');
        try {
          const error = new Error('socket hang up');
          socket.connect();
          FakeTransport.last().error(error);
          log.callCount.should.equal(1);
          log.firstCall.args.should.deep.equal([error]);
          onError.callCount.should.equal(1);
          onError.firstCall.args.should.deep.equal([]);
          socket.closed.should.equal(true);
        } finally {
          log.restore();
        }
      });
    });
  });
});
