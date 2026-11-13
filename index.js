/**
 * The package root: the client a caller constructs, the signing function and the API error class.
 */
import OddsHawk from './src/oddshawk.js';
import generateHash from './src/generateHash.js';
import OddsHawkApiError from './src/apiError.js';

export {
  OddsHawk,
  generateHash,
  OddsHawkApiError
};
