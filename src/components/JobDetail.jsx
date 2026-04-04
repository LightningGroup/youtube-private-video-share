import { normalizeBaseUrl } from '../utils/normalizeBaseUrl';
import { normalizeShareJobStatus, SHARE_JOB_STATUS } from '../constants/statuses';

const MESSAGE_PREVIEW_LENGTH = 160;

function statusClass(status) {
  const normalizedStatus = normalizeShareJobStatus(status);
  if (normalizedStatus === SHARE_JOB_STATUS.success) return 'status success';
  if (normalizedStatus === SHARE_JOB_STATUS.needsReauth) return 'status failed';
  if (normalizedStatus === SHARE_JOB_STATUS.failed) return 'status failed';
  if (normalizedStatus === SHARE_JOB_STATUS.partial) return 'status partial';
  if (normalizedStatus === SHARE_JOB_STATUS.queued) return 'status queued';
  if (normalizedStatus === SHARE_JOB_STATUS.claimed) return 'status running';
  return 'status running';
}

function normalizeMessagePreview(message) {
  return String(message ?? '').replace(/\s+/g, ' ').trim();
}

function createMessagePreview(message) {
  const normalizedMessage = normalizeMessagePreview(message);
  if (normalizedMessage.length <= MESSAGE_PREVIEW_LENGTH) {
    return normalizedMessage || '-';
  }

  return `${normalizedMessage.slice(0, MESSAGE_PREVIEW_LENGTH)}...`;
}

function shouldCollapseMessage(message) {
  const rawMessage = String(message ?? '');
  const normalizedMessage = normalizeMessagePreview(message);
  if (!normalizedMessage) {
    return false;
  }

  if (rawMessage.includes('\n')) {
    return true;
  }

  return normalizedMessage.length > MESSAGE_PREVIEW_LENGTH;
}

/**
 * 선택된 작업 상세와 상세 갱신 상태를 렌더링한다.
 */
export default function JobDetail({
  viewState,
  detail,
  selectedJobId,
  onRefresh,
  loading,
  isAutoRefreshing,
  lastUpdatedAt,
  manualError,
  pollingStatusMessage,
  baseUrl,
  artifactUrlBuilder
}) {
  const normalizedStatus = normalizeShareJobStatus(detail?.status);

  if (viewState !== 'ready') {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>5) 작업 상세</h2>
            {lastUpdatedAt && <p className="panel-meta">마지막 갱신 {lastUpdatedAt}</p>}
          </div>
          <button type="button" className="secondary-button" onClick={() => onRefresh()} disabled={!selectedJobId || loading}>
            {loading ? '상세 조회 중...' : '최신 상태 가져오기'}
          </button>
        </div>
        {viewState === 'idle' && <p>선택된 작업이 없습니다.</p>}
        {viewState === 'loading' && <p>작업 상세를 불러오는 중입니다.</p>}
        {viewState === 'manual_error' && <p className="message error">{manualError}</p>}
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>5) 작업 상세</h2>
          {lastUpdatedAt && <p className="panel-meta">마지막 갱신 {lastUpdatedAt}</p>}
          {isAutoRefreshing && <p className="panel-meta">실행 중인 작업이라 자동 갱신 중입니다.</p>}
          {pollingStatusMessage && <p className="panel-meta">{pollingStatusMessage}</p>}
        </div>
        <button type="button" className="secondary-button" onClick={() => onRefresh()} disabled={loading}>
          {loading ? '상세 조회 중...' : '최신 상태 가져오기'}
        </button>
      </div>
      {manualError && <p className="message error">{manualError}</p>}
      <p>
        Job ID: <strong>{detail.jobId}</strong>
      </p>
      <p>
        상태: <span className={statusClass(detail.status)}>{detail.status}</span>
      </p>
      {normalizedStatus === SHARE_JOB_STATUS.queued && (
        <p className="message info">
          작업은 생성됐지만 아직 agent가 가져가지 않았습니다. 서비스 저장소에서 `npm run agent`를 실행해 queue를 소비하세요.
        </p>
      )}
      {normalizedStatus === SHARE_JOB_STATUS.needsReauth && (
        <p className="message error">세션 만료, 다시 연결 필요</p>
      )}

      <h3>요약</h3>
      <ul className="meta-list">
        <li>totalVideos: {detail.summary?.totalVideos ?? '-'}</li>
        <li>successCount: {detail.summary?.successCount ?? '-'}</li>
        <li>failedCount: {detail.summary?.failedCount ?? '-'}</li>
      </ul>

      <h3>비디오 결과</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>videoId</th>
              <th>status</th>
              <th>addedCount</th>
              <th>message</th>
              <th>artifacts</th>
            </tr>
          </thead>
          <tbody>
            {(detail.results ?? []).map((item) => (
              <tr key={item.videoId}>
                <td>{item.videoId}</td>
                <td>
                  <span className={statusClass(item.status)}>{item.status}</span>
                </td>
                <td>{item.addedCount}</td>
                <td className="result-message-cell">
                  {!item.message && '-'}
                  {item.message && !shouldCollapseMessage(item.message) && (
                    <div className="result-message-inline">{item.message}</div>
                  )}
                  {item.message && shouldCollapseMessage(item.message) && (
                    <details className="result-message-details">
                      <summary>{createMessagePreview(item.message)}</summary>
                      <pre className="result-message-full">{item.message}</pre>
                    </details>
                  )}
                </td>
                <td>
                  {Array.isArray(item.artifacts) && item.artifacts.length > 0 ? (
                    <ul className="artifact-list in-cell">
                      {item.artifacts.map((artifact) => (
                        <li key={`${item.videoId}-${artifact.fileName}`}>
                          <a href={artifact.url ? `${normalizeBaseUrl(baseUrl)}${artifact.url}` : artifactUrlBuilder(baseUrl, detail.jobId, artifact.fileName)} target="_blank" rel="noreferrer">
                            {artifact.fileName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>로그</h3>
      <ul className="log-list">
        {(detail.logs ?? []).map((log, index) => (
          <li key={`${log.time}-${index}`}>
            [{new Date(log.time).toLocaleString()}] [{log.level}] {log.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
