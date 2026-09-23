/**
 * HTTP / transport error from the OddsHawk REST client.
 * Carries the status and body exactly as the API returned them; the API uses more than one body
 * shape (JSON `{ error }` on `/rest/match/*` plus coverage and throttle failures, plain text on the
 * odds routes), so no single error envelope is assumed here.
 */
export default class OddsHawkApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number|null, data?: *, code?: string|null, cause?: Error|null }} [opts]
   */
  constructor (message, { status = null, data = null, code = null, cause = null } = {}) {
    super(message);
    this.name = 'OddsHawkApiError';
    this.status = status;
    this.data = data;
    /**
     * The body's `code` field when present. Live failures use `error` instead
     * (e.g. `coverage_not_entitled`, `throttled`), which `message` quotes.
     */
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

const STATUS_HINT = {
  400: 'Bad Request',
  403: 'Forbidden (not authenticated or not permitted)',
  429: 'Too Many Requests',
  500: 'Internal Server Error'
};

/**
 * Map an axios failure into OddsHawkApiError with status / body when available.
 * @param {Error} err
 * @returns {OddsHawkApiError}
 */
export function mapAxiosError (err) {
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;
    let code = null;
    if (data && typeof data === 'object' && typeof data.code === 'string') {
      code = data.code;
    }
    const hint = STATUS_HINT[status];
    const label = hint ? `${status} ${hint}` : `HTTP ${status}`;
    let bodyMsg = '';
    if (typeof data === 'string') {
      bodyMsg = data;
    } else if (data && typeof data === 'object') {
      bodyMsg = data.message || data.error || '';
    }
    const message = bodyMsg
      ? `OddsHawk API ${label}: ${bodyMsg}`
      : `OddsHawk API ${label}`;
    return new OddsHawkApiError(message, { status, data, code, cause: err });
  }
  if (err.request) {
    return new OddsHawkApiError('OddsHawk API request failed: no response received', {
      cause: err
    });
  }
  return new OddsHawkApiError('OddsHawk API request failed: ' + err.message, {
    cause: err
  });
}
