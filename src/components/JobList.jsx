function statusClass(status) {
  if (status === 'success' || status === 'completed') return 'status success';
  if (status === 'needs_reauth') return 'status failed';
  if (status === 'failed') return 'status failed';
  if (status === 'partial') return 'status partial';
  if (status === 'queued') return 'status queued';
  if (status === 'claimed') return 'status running';
  return 'status running';
}

/**
 * 최근 작업 목록과 목록 갱신 액션을 렌더링한다.
 */
export default function JobList({ jobs, selectedJobId, onSelect, onRefresh, loading, lastUpdatedAt }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>4) 최근 작업 목록</h2>
          {lastUpdatedAt && <p className="panel-meta">마지막 갱신 {lastUpdatedAt}</p>}
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading}>
          {loading ? '목록 갱신 중...' : '목록 새로고침'}
        </button>
      </div>
      {loading && <p>불러오는 중...</p>}
      {!loading && jobs.length === 0 && <p>작업이 없습니다.</p>}

      <ul className="job-list">
        {(jobs ?? []).map((job) => (
          <li key={job.jobId}>
            <button
              type="button"
              onClick={() => onSelect(job.jobId)}
              className={selectedJobId === job.jobId ? 'active' : ''}
            >
              <span>{job.jobId}</span>
              <span className={statusClass(job.status)}>{job.status}</span>
              <small>{job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
