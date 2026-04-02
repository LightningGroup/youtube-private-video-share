import { normalizeBaseUrl } from '../utils/normalizeBaseUrl';

function statusClass(status) {
  if (status === 'success' || status === 'completed') return 'status success';
  if (status === 'failed') return 'status failed';
  if (status === 'partial') return 'status partial';
  if (status === 'queued') return 'status queued';
  return 'status running';
}

export default function JobDetail({ detail, baseUrl, artifactUrlBuilder }) {
  if (!detail) {
    return (
      <section className="panel">
        <h2>5) 작업 상세</h2>
        <p>선택된 작업이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>5) 작업 상세</h2>
      <p>
        Job ID: <strong>{detail.jobId}</strong>
      </p>
      <p>
        상태: <span className={statusClass(detail.status)}>{detail.status}</span>
      </p>

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
            {(detail.results || []).map((item) => (
              <tr key={item.videoId}>
                <td>{item.videoId}</td>
                <td>
                  <span className={statusClass(item.status)}>{item.status}</span>
                </td>
                <td>{item.addedCount}</td>
                <td>{item.message}</td>
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
        {(detail.logs || []).map((log, index) => (
          <li key={`${log.time}-${index}`}>
            [{new Date(log.time).toLocaleString()}] [{log.level}] {log.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
