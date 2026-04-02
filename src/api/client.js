function joinUrl(baseUrl, path) {
  const normalized = String(baseUrl || '').trim().replace(/\/$/, '');
  return `${normalized}${path}`;
}

async function request(baseUrl, path, options = {}) {
  const url = joinUrl(baseUrl, path);
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    const networkError = new Error('네트워크 오류: 서버에 연결할 수 없습니다.');
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  }

  if (!response.ok) {
    let message = `요청 실패 (${response.status})`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
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
    Authorization: `Bearer ${token}`
  };
}

export const apiClient = {
  getHealth(baseUrl) {
    return request(baseUrl, '/health');
  },

  getSessionStatus(baseUrl, token) {
    return request(baseUrl, '/api/session/status', {
      headers: authHeaders(token)
    });
  },

  uploadStorageState(baseUrl, token, file) {
    const formData = new FormData();
    formData.append('storageState', file);

    return request(baseUrl, '/api/session/storage-state', {
      method: 'POST',
      headers: authHeaders(token),
      body: formData
    });
  },

  deleteStorageState(baseUrl, token) {
    return request(baseUrl, '/api/session/storage-state', {
      method: 'DELETE',
      headers: authHeaders(token)
    });
  },

  createShareJob(baseUrl, token, payload) {
    return request(baseUrl, '/api/jobs/share', {
      method: 'POST',
      headers: authHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    });
  },

  getJobs(baseUrl, token) {
    return request(baseUrl, '/api/jobs', {
      headers: authHeaders(token)
    });
  },

  getJobDetail(baseUrl, token, jobId) {
    return request(baseUrl, `/api/jobs/${jobId}`, {
      headers: authHeaders(token)
    });
  },

  artifactUrl(baseUrl, jobId, fileName) {
    const encodedFile = encodeURIComponent(fileName);
    return joinUrl(baseUrl, `/api/jobs/${jobId}/artifacts/${encodedFile}`);
  }
};
