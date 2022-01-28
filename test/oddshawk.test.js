import chai from 'chai';
// import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import OddsHawk from '../src/oddshawk.js';
import Rest from '../src/rest.js';
import Socket from '../src/socket.js';

chai.use(sinonChai);
chai.should();

describe('Oddshawk', () => {
  describe('constructor', () => {
    it('should create rest and websocket objects', () => {
      const oddshawk = new OddsHawk('a', 'b');
      oddshawk.rest.should.be.an.instanceof(Rest);
      oddshawk.ws.should.be.an.instanceof(Socket);
    });
  });
});
