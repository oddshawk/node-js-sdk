/**
 * The error a failed catalog read or browser-mode exchange rejects with: what the API answered where a response arrived, and the axios failure behind it.
 * `name` reads `OddsHawkApiError`, whichever failure produced it.
 */
export default class OddsHawkApiError extends Error {
  /**
   * @param {string} message The failure's one line of text.
   * @param {Object} [details]
   * @param {number|null} [details.status=null] The response's HTTP status.
   * @param {*} [details.data=null] The response body as the API sent it.
   * @param {string|null} [details.code=null] The body's own `code` member.
   * @param {Error|null} [details.cause] The axios error behind the failure; the error carries no `cause` member unless one was supplied.
   */
  constructor (message, { status = null, data = null, code = null, cause = null } = {}) {
    super(message);
    this.name = 'OddsHawkApiError';
    this.status = status;
    this.data = data;
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
 * Turns an axios failure into an `OddsHawkApiError`, keeping the response when one arrived.
 * @param {Error} err
 * @returns {OddsHawkApiError} The error the caller receives, its message drawn from whichever part of the failure arrived.
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
