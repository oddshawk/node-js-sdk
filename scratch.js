import OddsHawk from './src/oddshawk.js';
const oddshawk = new OddsHawk('nomad3000@hotmail.co.uk', '*SAFJ4432fj7&83kj1facn0/', true);
// Connect to socket
oddshawk.ws.connect();
// Register callbacks
oddshawk.ws.onUpdate((data) => {
  console.log(data);
});
oddshawk.ws.onInitial((data) => {
  console.log(data);
});
oddshawk.ws.onClose(() => {
  console.log('closed');
});
// Subscribe
oddshawk.ws.subscribe({
  sport: 'Football'
});
