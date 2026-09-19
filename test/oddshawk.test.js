import * as chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import axios from 'axios';
import OddsHawk from '../src/oddshawk.js';
import Rest, { USER_HEADER, HASH_HEADER } from '../src/rest.js';
import Socket from '../src/socket.js';
import generateHash from '../src/generateHash.js';
import OddsHawkApiError, { mapAxiosError } from '../src/apiError.js';

chai.use(sinonChai);
const { expect } = chai;
chai.should();

describe('Oddshawk', () => {
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

  describe('generateHash', () => {
    it('should return sha256 hex plus 8-char time hex suffix', () => {
      const clock = sinon.useFakeTimers(1_700_000_000_000);
      try {
        const out = generateHash('password');
        out.should.be.a('string');
        out.length.should.equal(64 + 8);
        out.slice(-8).should.equal((1_700_000_000).toString(16));
        /^[0-9a-f]+$/.test(out).should.equal(true);
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
  });
});
