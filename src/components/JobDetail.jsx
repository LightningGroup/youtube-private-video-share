function statusClass(status) {
  if (status === 'success' || status === 'completed') return 'status success';
  if (status === 'failed') return 'status failed';
  if (status === 'partial') return 'status partial';
  return 'status running';
}

export default function JobDetail({ detail, baseUrl, token, artifactUrlBuilder }) {
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>로그</h3>
      <ul className="log-list">
        {(detail.logs || []).map((log, index) => (
          <li key={`${log.time}-${index}`}>
            [{log.time}] [{log.level}] {log.message}
          </li>
        ))}
      </ul>

      <h3>아티팩트</h3>
      <ul className="artifact-list">
        {(detail.artifacts || []).map((fileName) => (
          <li key={fileName}>
            <a
              href={artifactUrlBuilder(baseUrl, detail.jobId, fileName)}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!token) {
                  event.preventDefault();
                  alert('아티팩트 다운로드 전 관리자 토큰을 먼저 입력해 주세요.');
                }
              }}
            >
              {fileName}
            </a>
          </li>
        ))}
      </ul>
      <p className="hint">아티팩트 요청 시 브라우저/서버 설정에 따라 Authorization 헤더가 필요할 수 있습니다.</p>
    </section>
  );
}
