import { DEFAULT_USER_ID } from '../constants/statuses';
import { normalizeBaseUrl } from '../utils/normalizeBaseUrl';

function joinUrl(baseUrl, path) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function parseApiErrorMessage(data, fallback) {
  if (!data || typeof data !== 'object') return fallback;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (data.error && typeof data.error.message === 'string' && data.error.message.trim()) {
    return data.error.message;
  }
  return fallback;
}

async function request(baseUrl, path, options = {}) {
  const url = joinUrl(baseUrl, path);
  let response;

  try {
    response = await fetch(url, options);
  } catch (_) {
    const networkError = new Error('서버에 연결할 수 없습니다. Base URL 또는 네트워크를 확인하세요.');
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  }

  if (!response.ok) {
    let message = `요청 실패 (${response.status})`;

    try {
      const data = await response.json();
      message = parseApiErrorMessage(data, message);
    } catch (_) {
      // noop
    }

    const httpError = new Error(message);
    httpError.code = response.status === 401 || response.status === 403 ? 'AUTH_ERROR' : 'HTTP_ERROR';
    httpError.status = response.status;
    throw httpError;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.blob();
}

function authHeaders(token, headers = {}) {
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
    'x-user-id': DEFAULT_USER_ID
  };
}

function createJsonOptions(token, method, body = {}) {
  return {
    method,
    headers: authHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(body)
  };
}

function extractItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

export const apiClient = {
  getHealth(baseUrl) {
    return request(baseUrl, '/health');
  },

  createConnection(baseUrl, token, payload = {}) {
    return request(baseUrl, '/api/connections', createJsonOptions(token, 'POST', payload));
  },

  async getConnections(baseUrl, token) {
    const data = await request(baseUrl, '/api/connections', {
      headers: authHeaders(token)
    });

    return extractItems(data);
  },

  getConnection(baseUrl, token, connectionId) {
    return request(baseUrl, `/api/connections/${connectionId}`, {
      headers: authHeaders(token)
    });
  },

  createLoginSession(baseUrl, token, connectionId) {
    return request(baseUrl, `/api/connections/${connectionId}/login-sessions`, {
      method: 'POST',
      headers: authHeaders(token)
    });
  },

  getLoginSession(baseUrl, token, loginSessionId) {
    return request(baseUrl, `/api/login-sessions/${loginSessionId}`, {
      headers: authHeaders(token)
    });
  },

  createShareJob(baseUrl, token, payload) {
    return request(baseUrl, '/api/jobs/share', createJsonOptions(token, 'POST', payload));
  },

  async getJobs(baseUrl, token) {
    const data = await request(baseUrl, '/api/jobs', {
      headers: authHeaders(token)
    });

    return extractItems(data);
  },

  getJob(baseUrl, token, jobId) {
    return request(baseUrl, `/api/jobs/${jobId}`, {
      headers: authHeaders(token)
    });
  },

  artifactUrl(baseUrl, jobId, fileName) {
    const encodedFile = encodeURIComponent(fileName);
    return joinUrl(baseUrl, `/api/jobs/${jobId}/artifacts/${encodedFile}`);
  }
};
