# Odds Hawk JavaScript SDK

## Installation

`npm install @oddshawk/oddshawk-sdk`

## Usage

### Node.js
```js
import { OddsHawk } from '@oddshawk/oddshawk-sdk';

const oddshawk = new OddsHawk(username, key, true);

// Get odds from REST API
oddshawk.rest.odds({
  sport: 'Horse Racing'
}).then(data => {
  console.log(data);
});

// Connect to socket
oddshawk.ws.connect();
// Register callbacks
oddshawk.ws.onUpdate((data) => {
  console.log(data);
});
oddshawk.ws.onInitial((data) => {
  console.log(data);
});
// Subscribe
oddshawk.ws.subscribe({
  sport: 'Horse Racing'
});
```
### Browser
```js
import { OddsHawk } from '@oddshawk/oddshawk-sdk';

const oddshawk = new OddsHawk(username, hash, false); // Hash should be generated server side

// Get odds from REST API
oddshawk.rest.authenticate().then(() => {
  oddshawk.rest.odds({
    sport: 'Horse Racing'
  }).then(data => {
    console.log(data);
  });
});

// Connect to socket
oddshawk.ws.connect();
// Register callbacks
oddshawk.ws.onUpdate((data) => {
  console.log(data);
});
oddshawk.ws.onInitial((data) => {
  console.log(data);
});
// Subscribe
oddshawk.ws.subscribe({
  sport: 'Horse Racing'
});
```
