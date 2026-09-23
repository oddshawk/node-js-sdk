import fs from 'fs';
import path from 'path';
import * as chai from 'chai';

const { expect } = chai;

const ROOT = process.cwd();

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Everything a consumer sees: the npm README and the shipped sources.
const PUBLIC_FILES = [
  'README.md',
  'index.js',
  'src/oddshawk.js',
  'src/rest.js',
  'src/socket.js',
  'src/generateHash.js',
  'src/apiError.js'
];

// Internal-only material: the feed's per-provider branches and our task references.
const INTERNAL_PROVIDER_MARKERS = [/betfair/i, /\bexchange\b/i];
const INTERNAL_TASK_MARKERS = [/\bcn-\d+/i, /\bT1\b/, /\bT2\b/, /\bT6\b/];

const expectNoMatch = (text, markers, rel, what) => {
  markers.forEach((marker) => {
    expect(text, `${rel} must not carry ${what} (${marker})`).to.not.match(marker);
  });
};

const eachPublicFile = (assertion) => {
  PUBLIC_FILES.forEach((rel) => {
    assertion(read(rel), rel);
  });
};

describe('public docs', () => {
  it('keeps internal provider detail out of the README and sources', () => {
    eachPublicFile((text, rel) => {
      expectNoMatch(text, INTERNAL_PROVIDER_MARKERS, rel, 'internal provider detail');
    });
  });

  it('keeps internal task references out of the README and sources', () => {
    eachPublicFile((text, rel) => {
      expectNoMatch(text, INTERNAL_TASK_MARKERS, rel, 'an internal task reference');
    });
  });

  it('describes metering as live, not reserved or forthcoming', () => {
    const readme = read('README.md');
    expect(readme).to.not.match(/reserved|forthcoming/i);
    ['X-Data-Points-This-Hour', 'X-Data-Points-Limit', 'X-Hour-Resets-At'].forEach((header) => {
      expect(readme, `README.md must document the live ${header} header`).to.include(header);
    });
  });

  it('documents the live coverage and throttle statuses', () => {
    const readme = read('README.md');
    expect(readme).to.include('coverage_not_entitled');
    expect(readme).to.include('throttled');
    expect(readme).to.include('/rest/account');
  });

  it('keeps the planned codes marked as not live', () => {
    const readme = read('README.md');
    ['feed_down', 'catalog_dropped', 'payment_required'].forEach((code) => {
      expect(readme, `README.md must still list ${code}`).to.include(code);
    });
    expect(readme).to.match(/planned/i);
  });

  it('does not document the internal eventId key as a caller filter', () => {
    const readme = read('README.md');
    expect(readme).to.not.match(/eventId/i);
    expect(readme).to.include('eventTime');
    expect(readme).to.include('eventName');
  });

  it('still documents the catalog and matching surface', () => {
    const readme = read('README.md');
    ['rest.odds', 'rest.events', 'rest.sports', 'rest.markets', 'rest.providers', 'rest.competitions']
      .forEach((method) => {
        expect(readme, `README.md must document ${method}`).to.include(method);
      });
    ['matchEvent', 'matchSelection', 'matchTeam', 'matchCompetition'].forEach((method) => {
      expect(readme, `README.md must document ${method}`).to.include(method);
    });
  });
});
