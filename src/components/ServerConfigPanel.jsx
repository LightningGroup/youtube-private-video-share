import { useEffect, useState } from 'react';
import { normalizeBaseUrl } from '../utils/normalizeBaseUrl';

export default function ServerConfigPanel({
  baseUrl,
  token,
  onBaseUrlChange,
  onTokenChange,
  onTestConnection,
  healthResult,
  loading
}) {
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl);
  const [localToken, setLocalToken] = useState(token);

  useEffect(() => {
    setLocalBaseUrl(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    setLocalToken(token);
  }, [token]);

  const handleSave = () => {
    const normalizedBaseUrl = normalizeBaseUrl(localBaseUrl);
    const normalizedToken = localToken.trim();

    setLocalBaseUrl(normalizedBaseUrl);
    onBaseUrlChange(normalizedBaseUrl);
    onTokenChange(normalizedToken);
  };

  return (
    <section className="panel">
      <h2>1) 서버 연결 설정</h2>
      <div className="field">
        <label htmlFor="base-url">서버 Base URL</label>
        <input
          id="base-url"
          type="url"
          placeholder="https://your-server.example.com"
          value={localBaseUrl}
          onChange={(event) => setLocalBaseUrl(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="admin-token">관리자 토큰</label>
        <input
          id="admin-token"
          type="password"
          placeholder="Bearer 토큰 값"
          value={localToken}
          onChange={(event) => setLocalToken(event.target.value)}
        />
      </div>

      <div className="row gap-sm">
        <button type="button" onClick={handleSave} disabled={loading}>
          로컬 저장
        </button>
        <button type="button" onClick={() => onTestConnection(normalizeBaseUrl(localBaseUrl))} disabled={loading || !localBaseUrl.trim()}>
          {loading ? '확인 중...' : '연결 테스트 (/health)'}
        </button>
      </div>

      {healthResult && (
        <div className={`message ${healthResult.ok ? 'success' : 'error'}`}>
          {healthResult.ok ? (
            <p>
              연결 성공: {healthResult.service} (v{healthResult.version})
            </p>
          ) : (
            <p>연결 실패: {healthResult.message}</p>
          )}
        </div>
      )}
    </section>
  );
}
